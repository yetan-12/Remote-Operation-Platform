"""
Strategy Pattern: Teleop execution modes (ZMQ, USB, SharedBus).
Each strategy encapsulates its own loop and resource management.
"""
import threading
import time
from typing import Any, Dict, List, Optional

from ..events import Event, EventBus, EventType, get_event_bus
from ..interfaces import StateProvider


def _to_json_serializable(obj: Any) -> Any:
    if hasattr(obj, "tolist"):
        return obj.tolist()
    if hasattr(obj, "item"):
        return obj.item()
    if isinstance(obj, dict):
        return {k: _to_json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_json_serializable(x) for x in obj]
    return obj


def _obs_from_joint_state(joint_state) -> Dict[str, Any]:
    arr = joint_state.tolist() if hasattr(joint_state, "tolist") else list(joint_state)
    n = len(arr)
    jp = arr
    gp = arr[-1] if n > 0 else 0.0
    return {
        "joint_positions": jp,
        "joint_velocities": [0.0] * n,
        "ee_pos_quat": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        "gripper_position": gp,
    }


class BaseTeleopStrategy(StateProvider):
    """Base with shared state storage and event publishing."""

    def __init__(self, event_bus: Optional[EventBus] = None):
        self._event_bus = event_bus or get_event_bus()
        self._running = False
        self._leader_joints: List[float] = []
        self._follower_obs: Dict[str, Any] = {}
        self._error: Optional[str] = None

    def _update_state(self, leader: List[float], follower: Dict[str, Any], err: Optional[str] = None):
        self._leader_joints = leader
        self._follower_obs = _to_json_serializable(follower)
        self._error = err
        self._event_bus.publish(Event(
            EventType.TELEOP_STATE_UPDATED,
            {"leader_joints": self._leader_joints, "follower_obs": self._follower_obs, "error": err},
        ))
        if err:
            self._event_bus.publish(Event(EventType.TELEOP_ERROR, {"error": err}))

    def get_state(self) -> Dict[str, Any]:
        return {
            "running": self._running,
            "leader_joints": self._leader_joints,
            "follower_obs": self._follower_obs,
            "error": self._error,
        }


class ZMQTeleopStrategy(BaseTeleopStrategy):
    """Teleop via ZMQ: GELLO reads -> RobotEnv (ZMQ robot)."""

    def run(
        self,
        gello_port: str,
        robot_host: str,
        robot_port: int,
        robot_usb_port: Optional[str],
        hz: float = 50,
    ) -> None:
        try:
            from lib.gello_agent import GelloAgent
            from lib.robot_env import RobotEnv
            from lib.zmq_client_robot import ZMQClientRobot
        except ImportError as e:
            self._update_state([], {}, f"lib 导入失败: {e}")
            return
        agent = None
        env = None
        try:
            from lib.gello_agent import GENERIC_GELLO_CONFIG
            agent = GelloAgent(port=gello_port, dynamixel_config=GENERIC_GELLO_CONFIG)
            client = ZMQClientRobot(port=robot_port, host=robot_host)
            env = RobotEnv(client, control_rate_hz=hz)
            self._update_state([], {}, None)
        except Exception as e:
            self._update_state([], {}, str(e))
            return
        self._running = True
        self._event_bus.publish(Event(EventType.TELEOP_STARTED, {"mode": "zmq"}))
        dt = 1.0 / hz
        try:
            while self._running and agent and env:
                try:
                    obs = env.get_obs()
                    action = agent.act(obs)
                    env.step(action)
                    self._update_state(
                        action.tolist() if hasattr(action, "tolist") else list(action),
                        obs,
                        None,
                    )
                except Exception as e:
                    self._update_state(self._leader_joints, self._follower_obs, str(e))
                time.sleep(dt)
        finally:
            self._event_bus.publish(Event(EventType.TELEOP_STOPPED, {}))

    def stop(self) -> None:
        self._running = False


class USBSharedBusTeleopStrategy(BaseTeleopStrategy):
    """Single port: GELLO (1-7) and robot (8-14) on same Dynamixel bus."""

    LEADER_IDS = (1, 2, 3, 4, 5, 6, 7)
    FOLLOWER_IDS = (8, 9, 10, 11, 12, 13, 14)

    def run(
        self,
        gello_port: str,
        robot_host: str,
        robot_port: int,
        robot_usb_port: Optional[str],
        hz: float = 50,
    ) -> None:
        try:
            from dynamixel_sdk import PortHandler, PacketHandler, GroupSyncRead, GroupSyncWrite
            import numpy as np
        except ImportError as e:
            self._update_state([], {}, f"dynamixel_sdk 未安装: {e}")
            return
        ADDR_PRESENT, ADDR_GOAL, ADDR_TORQUE, LEN_POS = 132, 116, 64, 4
        BAUDRATE = 57600
        ph = PortHandler(gello_port)
        pk = PacketHandler(2.0)
        try:
            if not ph.openPort():
                self._update_state([], {}, f"无法打开串口 {gello_port}")
                return
            if not ph.setBaudRate(BAUDRATE):
                ph.closePort()
                self._update_state([], {}, f"设置波特率 {BAUDRATE} 失败")
                return
            for dxl_id in self.FOLLOWER_IDS:
                try:
                    pk.write1ByteTxRx(ph, dxl_id, ADDR_TORQUE, 1)
                except Exception:
                    pass
            group_read = GroupSyncRead(ph, pk, ADDR_PRESENT, LEN_POS)
            group_write = GroupSyncWrite(ph, pk, ADDR_GOAL, LEN_POS)
            for dxl_id in list(self.LEADER_IDS) + list(self.FOLLOWER_IDS):
                group_read.addParam(dxl_id)
            self._update_state([], {}, None)
        except Exception as e:
            self._update_state([], {}, str(e))
            try:
                ph.closePort()
            except Exception:
                pass
            return
        self._running = True
        self._event_bus.publish(Event(EventType.TELEOP_STARTED, {"mode": "usb_shared"}))
        dt = 1.0 / hz

        def _raw_to_rad(raw: int) -> float:
            if raw > 0x7FFFFFFF:
                raw -= 0x100000000
            return raw / 2048.0 * 3.141592653589793

        def _rad_to_param(rad: float) -> list:
            v = int(rad * 2048 / 3.141592653589793)
            return [v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, (v >> 24) & 0xFF]

        try:
            while self._running:
                try:
                    group_read.txRxPacket()
                    leader_rad = []
                    for dxl_id in self.LEADER_IDS:
                        if group_read.isAvailable(dxl_id, ADDR_PRESENT, LEN_POS):
                            raw = group_read.getData(dxl_id, ADDR_PRESENT, LEN_POS)
                            leader_rad.append(_raw_to_rad(raw))
                        else:
                            leader_rad.append(0.0)
                    while len(leader_rad) < 7:
                        leader_rad.append(0.0)
                    group_write.clearParam()
                    for i, dxl_id in enumerate(self.FOLLOWER_IDS):
                        r = leader_rad[i] if i < len(leader_rad) else 0.0
                        group_write.addParam(dxl_id, _rad_to_param(r))
                    group_write.txPacket()
                    group_read.txRxPacket()
                    follower_rad = []
                    for dxl_id in self.FOLLOWER_IDS:
                        if group_read.isAvailable(dxl_id, ADDR_PRESENT, LEN_POS):
                            raw = group_read.getData(dxl_id, ADDR_PRESENT, LEN_POS)
                            follower_rad.append(_raw_to_rad(raw))
                        else:
                            follower_rad.append(0.0)
                    while len(follower_rad) < 7:
                        follower_rad.append(0.0)
                    import numpy as np
                    self._update_state(
                        leader_rad[:7],
                        _obs_from_joint_state(np.array(follower_rad)),
                        None,
                    )
                except Exception as e:
                    self._update_state(self._leader_joints, self._follower_obs, str(e))
                time.sleep(dt)
        finally:
            try:
                for dxl_id in self.FOLLOWER_IDS:
                    pk.write1ByteTxRx(ph, dxl_id, ADDR_TORQUE, 0)
            except Exception:
                pass
            try:
                ph.closePort()
            except Exception:
                pass
            self._event_bus.publish(Event(EventType.TELEOP_STOPPED, {}))

    def stop(self) -> None:
        self._running = False


class USBDualPortTeleopStrategy(BaseTeleopStrategy):
    """Two ports: GELLO and robot on separate USB ports."""

    def run(
        self,
        gello_port: str,
        robot_host: str,
        robot_port: int,
        robot_usb_port: Optional[str],
        hz: float = 50,
    ) -> None:
        try:
            from lib.gello_agent import GelloAgent, GENERIC_GELLO_CONFIG
            from lib.dynamixel_robot import DynamixelRobot
            import numpy as np
        except ImportError as e:
            self._update_state([], {}, f"lib 导入失败: {e}")
            return
        try:
            from serial.tools import list_ports
            available = [p.device for p in list_ports.comports()]
        except Exception:
            available = []
        if robot_usb_port and robot_usb_port not in available:
            self._update_state([], {}, f"机械臂串口 '{robot_usb_port}' 不存在。可用: {available or '无'}")
            return
        if gello_port not in available:
            self._update_state([], {}, f"GELLO 串口 '{gello_port}' 不存在")
            return
        agent = None
        robot_follower = None
        try:
            robot_follower = DynamixelRobot(
                joint_ids=(1, 2, 3, 4, 5, 6),
                joint_offsets=(0.0,) * 6,
                joint_signs=(1,) * 6,
                real=True,
                port=robot_usb_port,
                baudrate=57600,
                gripper_config=(7, 0, 90),
            )
            agent = GelloAgent(port=gello_port, dynamixel_config=GENERIC_GELLO_CONFIG)
            robot_follower.set_torque_mode(True)
            self._update_state([], {}, None)
        except Exception as e:
            self._update_state([], {}, str(e))
            return
        self._running = True
        self._event_bus.publish(Event(EventType.TELEOP_STARTED, {"mode": "usb_dual"}))
        dt = 1.0 / hz
        try:
            while self._running and agent and robot_follower:
                try:
                    action = agent.act({})
                    if hasattr(action, "tolist"):
                        action = np.array(action)
                    robot_follower.command_joint_state(action)
                    follower_state = robot_follower.get_joint_state()
                    self._update_state(
                        action.tolist() if hasattr(action, "tolist") else list(action),
                        _obs_from_joint_state(follower_state),
                        None,
                    )
                except Exception as e:
                    self._update_state(self._leader_joints, self._follower_obs, str(e))
                time.sleep(dt)
        finally:
            try:
                if robot_follower:
                    robot_follower.set_torque_mode(False)
                    if hasattr(robot_follower, "_driver"):
                        robot_follower._driver.close()
            except Exception:
                pass
            try:
                if agent and hasattr(agent, "_robot") and hasattr(agent._robot, "_driver"):
                    agent._robot._driver.close()
            except Exception:
                pass
            self._event_bus.publish(Event(EventType.TELEOP_STOPPED, {}))

    def stop(self) -> None:
        self._running = False


class TeleopStrategyFactory:
    """Factory Pattern: create appropriate strategy from config."""

    @staticmethod
    def create(
        gello_port: str,
        robot_usb_port: Optional[str],
    ) -> BaseTeleopStrategy:
        if not robot_usb_port:
            return ZMQTeleopStrategy()
        use_shared = robot_usb_port == gello_port or str(robot_usb_port).upper() == "SAME"
        if use_shared:
            return USBSharedBusTeleopStrategy()
        return USBDualPortTeleopStrategy()
