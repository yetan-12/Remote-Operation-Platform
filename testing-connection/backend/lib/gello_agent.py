"""GelloAgent for testing-connection. Standalone, no gello_software."""
from dataclasses import dataclass
from typing import Dict, Optional, Sequence, Tuple

import numpy as np

from .dynamixel_robot import DynamixelRobot


@dataclass
class DynamixelRobotConfig:
    joint_ids: Sequence[int]
    joint_offsets: Sequence[float]
    joint_signs: Sequence[int]
    gripper_config: Tuple[int, int, int]

    def __post_init__(self):
        assert len(self.joint_ids) == len(self.joint_offsets) == len(self.joint_signs)

    def make_robot(
        self,
        port: str = "/dev/ttyUSB0",
        start_joints: Optional[np.ndarray] = None,
        baudrate: int = 57600,
    ) -> DynamixelRobot:
        return DynamixelRobot(
            joint_ids=self.joint_ids,
            joint_offsets=list(self.joint_offsets),
            joint_signs=list(self.joint_signs),
            real=True,
            port=port,
            baudrate=baudrate,
            gripper_config=self.gripper_config,
            start_joints=start_joints,
        )


# Generic config for unknown ports (COM3, COM4, etc.)
GENERIC_GELLO_CONFIG = DynamixelRobotConfig(
    joint_ids=(1, 2, 3, 4, 5, 6),
    joint_offsets=(0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
    joint_signs=(1, 1, 1, 1, 1, 1),
    gripper_config=(7, 0, 90),
)


class GelloAgent:
    """GELLO leader agent: reads joint state from Dynamixel GELLO device."""

    def __init__(
        self,
        port: str,
        dynamixel_config: Optional[DynamixelRobotConfig] = None,
        start_joints: Optional[np.ndarray] = None,
    ):
        config = dynamixel_config or GENERIC_GELLO_CONFIG
        self._robot = config.make_robot(port=port, start_joints=start_joints, baudrate=57600)

    def act(self, obs: Dict) -> np.ndarray:
        return self._robot.get_joint_state()
