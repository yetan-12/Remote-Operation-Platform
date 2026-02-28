"""
Minimal DynamixelDriver for testing-connection. Windows-compatible, no lsof/fuser.
Standalone replacement for gello.dynamixel.driver, uses dynamixel-sdk from pip.
"""
from threading import Event, Lock, Thread
from typing import Optional, Protocol, Sequence, Tuple

import numpy as np

try:
    from dynamixel_sdk.port_handler import PortHandler
    from dynamixel_sdk.packet_handler import PacketHandler
    from dynamixel_sdk.group_sync_read import GroupSyncRead
    from dynamixel_sdk.group_sync_write import GroupSyncWrite
    from dynamixel_sdk.robotis_def import COMM_SUCCESS
except ImportError:
    PortHandler = PacketHandler = GroupSyncRead = GroupSyncWrite = None
    COMM_SUCCESS = 0

ADDR_TORQUE_ENABLE = 64
ADDR_GOAL_POSITION = 116
LEN_GOAL_POSITION = 4
ADDR_PRESENT_POSITION = 132
LEN_PRESENT_POSITION = 4
ADDR_PRESENT_VELOCITY = 128
LEN_PRESENT_VELOCITY = 4
TORQUE_ENABLE = 1
TORQUE_DISABLE = 0


class DynamixelDriverProtocol(Protocol):
    def set_joints(self, joint_angles: Sequence[float]): ...
    def set_torque_mode(self, enable: bool): ...
    def torque_enabled(self) -> bool: ...
    def get_joints(self) -> np.ndarray: ...
    def close(self): ...


class FakeDynamixelDriver(DynamixelDriverProtocol):
    def __init__(self, ids: Sequence[int]):
        self._ids = list(ids)
        self._joint_angles = np.zeros(len(ids), dtype=float)
        self._velocities = np.zeros(len(ids), dtype=float)
        self._torque_enabled = False

    def set_joints(self, joint_angles: Sequence[float]):
        if len(joint_angles) != len(self._ids):
            raise ValueError("joint_angles length must match number of servos")
        if not self._torque_enabled:
            raise RuntimeError("Torque must be enabled to set joint angles")
        self._joint_angles = np.array(joint_angles, dtype=float)

    def set_torque_mode(self, enable: bool):
        self._torque_enabled = enable

    def torque_enabled(self) -> bool:
        return self._torque_enabled

    def get_joints(self) -> np.ndarray:
        return self._joint_angles.copy()

    def close(self):
        pass


class DynamixelDriver(DynamixelDriverProtocol):
    """Dynamixel driver using dynamixel-sdk. Windows-compatible (no lsof/fuser)."""

    def __init__(
        self,
        ids: Sequence[int],
        port: str = "/dev/ttyUSB0",
        baudrate: int = 57600,
        max_retries: int = 3,
        use_fake_fallback: bool = True,
    ):
        self._ids = list(ids)
        self._joint_angles = None
        self._velocities = None
        self._lock = Lock()
        self._port = port
        self._baudrate = baudrate
        self._max_retries = max_retries
        self._use_fake_fallback = use_fake_fallback
        self._is_fake = False
        self._torque_enabled = False
        self._stop_thread = Event()

        if PortHandler is None or PacketHandler is None:
            if use_fake_fallback:
                self._initialize_fake_driver()
                return
            raise RuntimeError("dynamixel-sdk not installed. pip install dynamixel-sdk")

        if not self._initialize_with_retries():
            if use_fake_fallback:
                self._initialize_fake_driver()
            else:
                raise RuntimeError("Failed to initialize Dynamixel driver after all retries")

    def _initialize_fake_driver(self):
        self._is_fake = True
        self._fake_joint_angles = np.zeros(len(self._ids), dtype=float)
        self._fake_velocities = np.zeros(len(self._ids), dtype=float)

    def _initialize_with_retries(self) -> bool:
        import time
        for attempt in range(self._max_retries):
            try:
                self._initialize_hardware()
                return True
            except Exception as e:
                if attempt < self._max_retries - 1:
                    import time
                    time.sleep(2)
        return False

    def _initialize_hardware(self):
        self._portHandler = PortHandler(self._port)
        self._packetHandler = PacketHandler(2.0)
        self._groupSyncRead = GroupSyncRead(
            self._portHandler,
            self._packetHandler,
            ADDR_PRESENT_VELOCITY,
            LEN_PRESENT_VELOCITY + LEN_PRESENT_POSITION,
        )
        self._groupSyncWrite = GroupSyncWrite(
            self._portHandler,
            self._packetHandler,
            ADDR_GOAL_POSITION,
            LEN_GOAL_POSITION,
        )

        if not self._portHandler.openPort():
            raise RuntimeError(f"Failed to open port {self._port}")
        if not self._portHandler.setBaudRate(self._baudrate):
            self._portHandler.closePort()
            raise RuntimeError(f"Failed to set baudrate {self._baudrate}")

        for dxl_id in self._ids:
            if not self._groupSyncRead.addParam(dxl_id):
                self._portHandler.closePort()
                raise RuntimeError(f"Failed to add param for ID {dxl_id}")

        self.set_torque_mode(self._torque_enabled)
        self._reading_thread = Thread(target=self._read_joint_states, daemon=True)
        self._reading_thread.start()

    def _read_joint_states(self):
        import time
        while not self._stop_thread.is_set():
            time.sleep(0.001)
            with self._lock:
                try:
                    result = self._groupSyncRead.txRxPacket()
                    if result != COMM_SUCCESS:
                        continue
                    _joint_angles = np.zeros(len(self._ids), dtype=int)
                    _velocities = np.zeros(len(self._ids), dtype=int)
                    for i, dxl_id in enumerate(self._ids):
                        if self._groupSyncRead.isAvailable(
                            dxl_id, ADDR_PRESENT_VELOCITY, LEN_PRESENT_VELOCITY
                        ):
                            v = self._groupSyncRead.getData(
                                dxl_id, ADDR_PRESENT_VELOCITY, LEN_PRESENT_VELOCITY
                            )
                            if v > 0x7FFFFFFF:
                                v -= 0x100000000
                            _velocities[i] = v
                        if self._groupSyncRead.isAvailable(
                            dxl_id, ADDR_PRESENT_POSITION, LEN_PRESENT_POSITION
                        ):
                            a = self._groupSyncRead.getData(
                                dxl_id, ADDR_PRESENT_POSITION, LEN_PRESENT_POSITION
                            )
                            if a > 0x7FFFFFFF:
                                a -= 0x100000000
                            _joint_angles[i] = a
                    self._joint_angles = _joint_angles
                    self._velocities = _velocities
                except Exception:
                    pass

    def set_joints(self, joint_angles: Sequence[float]):
        if len(joint_angles) != len(self._ids):
            raise ValueError("joint_angles length must match number of servos")
        if not self._torque_enabled:
            raise RuntimeError("Torque must be enabled to set joint angles")

        if self._is_fake:
            self._fake_joint_angles = np.array(joint_angles)
            return

        for dxl_id, angle in zip(self._ids, joint_angles):
            position_value = int(angle * 2048 / np.pi)
            param = [
                position_value & 0xFF,
                (position_value >> 8) & 0xFF,
                (position_value >> 16) & 0xFF,
                (position_value >> 24) & 0xFF,
            ]
            self._groupSyncWrite.addParam(dxl_id, param)
        self._groupSyncWrite.txPacket()
        self._groupSyncWrite.clearParam()

    def set_torque_mode(self, enable: bool):
        if self._is_fake:
            self._torque_enabled = enable
            return
        torque_value = TORQUE_ENABLE if enable else TORQUE_DISABLE
        with self._lock:
            for dxl_id in self._ids:
                self._packetHandler.write1ByteTxRx(
                    self._portHandler, dxl_id, ADDR_TORQUE_ENABLE, torque_value
                )
        self._torque_enabled = enable

    def torque_enabled(self) -> bool:
        return self._torque_enabled

    def get_joints(self) -> np.ndarray:
        if self._is_fake:
            return self._fake_joint_angles.copy()
        while self._joint_angles is None:
            import time
            time.sleep(0.1)
        return self._joint_angles.copy() / 2048.0 * np.pi

    def close(self):
        if self._is_fake:
            return
        self._stop_thread.set()
        if hasattr(self, "_reading_thread"):
            self._reading_thread.join(timeout=2.0)
        self._portHandler.closePort()
