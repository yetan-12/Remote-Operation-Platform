"""DynamixelRobot for testing-connection. Standalone, no gello_software."""
from typing import Dict, Optional, Sequence, Tuple

import numpy as np

from .dynamixel_driver import DynamixelDriver, DynamixelDriverProtocol, FakeDynamixelDriver


class DynamixelRobot:
    """Dynamixel-based robot (GELLO or follower arm)."""

    def __init__(
        self,
        joint_ids: Sequence[int],
        joint_offsets: Optional[Sequence[float]] = None,
        joint_signs: Optional[Sequence[int]] = None,
        real: bool = False,
        port: str = "/dev/ttyUSB0",
        baudrate: int = 57600,
        gripper_config: Optional[Tuple[int, float, float]] = None,
        start_joints: Optional[np.ndarray] = None,
    ):
        self.gripper_open_close: Optional[Tuple[float, float]] = None
        if gripper_config is not None:
            assert joint_offsets is not None and joint_signs is not None
            joint_ids = tuple(joint_ids) + (gripper_config[0],)
            joint_offsets = tuple(joint_offsets) + (0.0,)
            joint_signs = tuple(joint_signs) + (1,)
            self.gripper_open_close = (
                gripper_config[1] * np.pi / 180,
                gripper_config[2] * np.pi / 180,
            )
        else:
            self.gripper_open_close = None

        self._joint_ids = tuple(joint_ids)
        self._joint_offsets = np.array(joint_offsets) if joint_offsets else np.zeros(len(joint_ids))
        self._joint_signs = np.array(joint_signs) if joint_signs else np.ones(len(joint_ids))
        self._alpha = 0.99
        self._last_pos = None

        assert len(self._joint_ids) == len(self._joint_offsets) == len(self._joint_signs)

        if real:
            self._driver: DynamixelDriverProtocol = DynamixelDriver(
                list(self._joint_ids), port=port, baudrate=baudrate
            )
            self._driver.set_torque_mode(False)
        else:
            self._driver = FakeDynamixelDriver(self._joint_ids)

        self._torque_on = False

        if start_joints is not None:
            current = self.get_joint_state()
            if gripper_config:
                current = current[:-1]
                sj = start_joints[:-1]
            else:
                sj = start_joints
            new_offsets = []
            for idx, (c, s, o) in enumerate(zip(current, sj, self._joint_offsets)):
                new_offsets.append(
                    np.pi * 2 * np.round((-s + c) / (2 * np.pi)) * self._joint_signs[idx] + o
                )
            if gripper_config:
                new_offsets.append(self._joint_offsets[-1])
            self._joint_offsets = np.array(new_offsets)

    def num_dofs(self) -> int:
        return len(self._joint_ids)

    def get_joint_state(self) -> np.ndarray:
        pos = (self._driver.get_joints() - self._joint_offsets) * self._joint_signs

        if self.gripper_open_close is not None:
            g_pos = (pos[-1] - self.gripper_open_close[0]) / (
                self.gripper_open_close[1] - self.gripper_open_close[0]
            )
            g_pos = min(max(0, g_pos), 1)
            pos[-1] = g_pos

        if self._last_pos is None:
            self._last_pos = pos.copy()
        else:
            pos = self._last_pos * (1 - self._alpha) + pos * self._alpha
            self._last_pos = pos

        return pos

    def command_joint_state(self, joint_state: np.ndarray) -> None:
        arr = np.array(joint_state, dtype=float)
        if self.gripper_open_close is not None and len(arr) == len(self._joint_ids):
            # Gripper is [0,1]; convert to radians for servo
            open_rad, closed_rad = self.gripper_open_close
            arr = arr.copy()
            arr[-1] = open_rad + arr[-1] * (closed_rad - open_rad)
        self._driver.set_joints((arr + self._joint_offsets).tolist())

    def set_torque_mode(self, mode: bool):
        if mode != self._torque_on:
            self._driver.set_torque_mode(mode)
            self._torque_on = mode

    def get_observations(self) -> Dict[str, np.ndarray]:
        js = self.get_joint_state()
        n = len(js)
        return {
            "joint_positions": js,
            "joint_velocities": np.zeros(n),
            "ee_pos_quat": np.zeros(7),
            "gripper_position": js[-1] if n > 0 else np.array(0.0),
        }
