"""
Teleop runner: GELLO (leader) controls robot (follower).
Uses lib/ (standalone), no gello_software dependency.
Stores last leader_joints and follower_obs for API polling at 20ms.
"""
import threading
import time
from typing import Any, Dict, List, Optional

# Module-level state (updated by teleop thread)
_teleop_running = False
_teleop_thread: Optional[threading.Thread] = None
_last_leader_joints: List[float] = []
_last_follower_obs: Dict[str, Any] = {}
_teleop_error: Optional[str] = None

# Generic GELLO config for COM3, COM4, etc (6 arm joints + gripper id 7)
_GENERIC_GELLO_CONFIG = None

# Shared-bus IDs: leader (GELLO) 1-7, follower (robot) 8-14 (hardcoded for single-port mode)
LEADER_IDS = (1, 2, 3, 4, 5, 6, 7)
FOLLOWER_IDS = (8, 9, 10, 11, 12, 13, 14)


def _get_generic_gello_config():
    global _GENERIC_GELLO_CONFIG
    if _GENERIC_GELLO_CONFIG is not None:
        return _GENERIC_GELLO_CONFIG
    try:
        from lib.gello_agent import GENERIC_GELLO_CONFIG
        _GENERIC_GELLO_CONFIG = GENERIC_GELLO_CONFIG
    except Exception:
        _GENERIC_GELLO_CONFIG = "error"
    return _GENERIC_GELLO_CONFIG


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
    """Build follower_obs dict for frontend from Dynamixel joint_state."""
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


def _teleop_loop_zmq(gello_port: str, robot_host: str, robot_port: int, hz: float = 50):
    global _last_leader_joints, _last_follower_obs, _teleop_error
    try:
        from lib.gello_agent import GelloAgent
        from lib.robot_env import RobotEnv
        from lib.zmq_client_robot import ZMQClientRobot
    except ImportError as e:
        _teleop_error = f"lib 导入失败: {e}"
        return
    agent = None
    env = None
    try:
        config = _get_generic_gello_config()
        if config == "error":
            _teleop_error = "无法创建 GELLO 配置"
            return
        agent = GelloAgent(port=gello_port, dynamixel_config=config)
        client = ZMQClientRobot(port=robot_port, host=robot_host)
        env = RobotEnv(client, control_rate_hz=hz)
        _teleop_error = None
    except Exception as e:
        _teleop_error = str(e)
        return
    dt = 1.0 / hz
    while _teleop_running and agent is not None and env is not None:
        try:
            obs = env.get_obs()
            action = agent.act(obs)
            env.step(action)
            _last_leader_joints = action.tolist() if hasattr(action, "tolist") else list(action)
            _last_follower_obs = _to_json_serializable(obs)
        except Exception as e:
            _teleop_error = str(e)
        time.sleep(dt)


def _list_available_ports() -> List[str]:
    """List available COM/serial ports."""
    try:
        from serial.tools import list_ports
        return [p.device for p in list_ports.comports()]
    except Exception:
        return []


def _raw_to_rad(raw: int) -> float:
    if raw > 0x7FFFFFFF:
        raw -= 0x100000000
    return raw / 2048.0 * 3.141592653589793


def _rad_to_param(rad: float) -> list:
    v = int(rad * 2048 / 3.141592653589793)
    return [v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, (v >> 24) & 0xFF]


def _teleop_loop_usb_shared_bus(port: str, hz: float = 50):
    """Single-port mode: GELLO (IDs 1-7) and robot (IDs 8-14) on same Dynamixel bus."""
    global _last_leader_joints, _last_follower_obs, _teleop_error
    try:
        from dynamixel_sdk import PortHandler, PacketHandler, GroupSyncRead, GroupSyncWrite
        import numpy as np
    except ImportError as e:
        _teleop_error = f"dynamixel_sdk 未安装: {e}"
        return
    ADDR_PRESENT = 132
    ADDR_GOAL = 116
    ADDR_TORQUE = 64
    LEN = 4
    BAUDRATE = 57600
    ph = PortHandler(port)
    pk = PacketHandler(2.0)
    try:
        if not ph.openPort():
            _teleop_error = f"无法打开串口 {port}"
            return
        if not ph.setBaudRate(BAUDRATE):
            ph.closePort()
            _teleop_error = f"设置波特率 {BAUDRATE} 失败"
            return
        for dxl_id in FOLLOWER_IDS:
            try:
                pk.write1ByteTxRx(ph, dxl_id, ADDR_TORQUE, 1)
            except Exception:
                pass
        group_read = GroupSyncRead(ph, pk, ADDR_PRESENT, LEN)
        group_write = GroupSyncWrite(ph, pk, ADDR_GOAL, LEN)
        for dxl_id in list(LEADER_IDS) + list(FOLLOWER_IDS):
            group_read.addParam(dxl_id)
        _teleop_error = None
    except Exception as e:
        _teleop_error = str(e)
        try:
            ph.closePort()
        except Exception:
            pass
        return
    dt = 1.0 / hz
    try:
        while _teleop_running:
            try:
                group_read.txRxPacket()
                leader_rad = []
                for dxl_id in LEADER_IDS:
                    if group_read.isAvailable(dxl_id, ADDR_PRESENT, LEN):
                        raw = group_read.getData(dxl_id, ADDR_PRESENT, LEN)
                        leader_rad.append(_raw_to_rad(raw))
                    else:
                        leader_rad.append(0.0)
                while len(leader_rad) < 7:
                    leader_rad.append(0.0)
                _last_leader_joints = leader_rad[:7]
                group_write.clearParam()
                for i, dxl_id in enumerate(FOLLOWER_IDS):
                    r = leader_rad[i] if i < len(leader_rad) else 0.0
                    group_write.addParam(dxl_id, _rad_to_param(r))
                group_write.txPacket()
                group_read.txRxPacket()
                follower_rad = []
                for dxl_id in FOLLOWER_IDS:
                    if group_read.isAvailable(dxl_id, ADDR_PRESENT, LEN):
                        raw = group_read.getData(dxl_id, ADDR_PRESENT, LEN)
                        follower_rad.append(_raw_to_rad(raw))
                    else:
                        follower_rad.append(0.0)
                while len(follower_rad) < 7:
                    follower_rad.append(0.0)
                _last_follower_obs = _to_json_serializable(
                    _obs_from_joint_state(np.array(follower_rad))
                )
            except Exception as e:
                _teleop_error = str(e)
            time.sleep(dt)
    finally:
        try:
            for dxl_id in FOLLOWER_IDS:
                pk.write1ByteTxRx(ph, dxl_id, ADDR_TORQUE, 0)
        except Exception:
            pass
        try:
            ph.closePort()
        except Exception:
            pass


def _teleop_loop_usb(gello_port: str, robot_usb_port: str, hz: float = 50):
    """Direct USB teleop: GELLO (Dynamixel) -> Robot (Dynamixel), bypasses ZMQ."""
    global _last_leader_joints, _last_follower_obs, _teleop_error
    try:
        from lib.gello_agent import GelloAgent
        from lib.dynamixel_robot import DynamixelRobot
        import numpy as np
    except ImportError as e:
        _teleop_error = f"lib 导入失败: {e}"
        return
    agent = None
    robot_follower = None
    available = _list_available_ports()
    if robot_usb_port not in available:
        _teleop_error = (
            f"机械臂串口 '{robot_usb_port}' 不存在。可用串口: {available or '无'}。"
            "请检查机械臂是否已连接，并在「机械臂 USB」中重新检测。"
        )
        return
    if gello_port not in available:
        _teleop_error = (
            f"GELLO 串口 '{gello_port}' 不存在。可用串口: {available or '无'}。"
        )
        return
    try:
        config = _get_generic_gello_config()
        if config == "error":
            _teleop_error = "无法创建 GELLO 配置"
            return
        robot_follower = DynamixelRobot(
            joint_ids=(1, 2, 3, 4, 5, 6),
            joint_offsets=(0.0,) * 6,
            joint_signs=(1,) * 6,
            real=True,
            port=robot_usb_port,
            baudrate=57600,
            gripper_config=(7, 0, 90),
        )
        agent = GelloAgent(port=gello_port, dynamixel_config=config)
        robot_follower.set_torque_mode(True)
        _teleop_error = None
    except Exception as e:
        _teleop_error = str(e)
        return
    try:
        dt = 1.0 / hz
        while _teleop_running and agent is not None and robot_follower is not None:
            try:
                action = agent.act({})
                if hasattr(action, "tolist"):
                    action = np.array(action)
                robot_follower.command_joint_state(action)
                follower_state = robot_follower.get_joint_state()
                _last_leader_joints = action.tolist() if hasattr(action, "tolist") else list(action)
                _last_follower_obs = _to_json_serializable(_obs_from_joint_state(follower_state))
            except Exception as e:
                _teleop_error = str(e)
            time.sleep(dt)
    finally:
        try:
            if robot_follower is not None:
                robot_follower.set_torque_mode(False)
                if hasattr(robot_follower, "_driver"):
                    robot_follower._driver.close()
        except Exception:
            pass
        try:
            if agent is not None and hasattr(agent, "_robot"):
                if hasattr(agent._robot, "_driver"):
                    agent._robot._driver.close()
        except Exception:
            pass


def start_teleop(
    gello_port: str,
    robot_host: str = "127.0.0.1",
    robot_port: int = 6001,
    robot_usb_port: Optional[str] = None,
):
    """Start teleop. If robot_usb_port is set, use direct USB (bypass ZMQ); else use ZMQ."""
    global _teleop_running, _teleop_thread
    if _teleop_running:
        return False, "遥操作已在运行"
    if robot_usb_port:
        avail = _list_available_ports()
        if gello_port not in avail:
            return False, f"GELLO 串口 '{gello_port}' 不存在。当前可用: {', '.join(avail) or '无'}。"
        use_shared_bus = robot_usb_port == gello_port or robot_usb_port.upper() == "SAME"
        if use_shared_bus:
            pass
        elif robot_usb_port not in avail:
            return False, (
                f"机械臂串口 '{robot_usb_port}' 不存在。当前可用: {', '.join(avail) or '无'}。"
                "若 GELLO 与机械臂在同一总线，请将机械臂串口选为与 GELLO 相同以使用单口模式。"
            )
    _teleop_running = True
    if robot_usb_port:
        use_shared_bus = robot_usb_port == gello_port or robot_usb_port.upper() == "SAME"
        if use_shared_bus:
            _teleop_thread = threading.Thread(
                target=_teleop_loop_usb_shared_bus,
                args=(gello_port,),
                daemon=True,
            )
        else:
            _teleop_thread = threading.Thread(
                target=_teleop_loop_usb,
                args=(gello_port, robot_usb_port),
                daemon=True,
            )
    else:
        _teleop_thread = threading.Thread(
            target=_teleop_loop_zmq,
            args=(gello_port, robot_host, robot_port),
            daemon=True,
        )
    _teleop_thread.start()
    return True, None


def stop_teleop():
    global _teleop_running
    _teleop_running = False


def get_teleop_state() -> Dict[str, Any]:
    return {
        "running": _teleop_running,
        "leader_joints": _last_leader_joints,
        "follower_obs": _last_follower_obs,
        "error": _teleop_error,
    }
