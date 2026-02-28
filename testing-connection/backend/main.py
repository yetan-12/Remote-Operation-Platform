"""
Testing connection backend. Standalone — no gello_software dependency.
- Robot: ZMQ REQ socket, pickle protocol (num_dofs / get_observations).
- GELLO: Dynamixel serial at 57600.
"""
import pickle
from typing import Optional

import zmq
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Testing Connection API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RobotTestRequest(BaseModel):
    host: str = "127.0.0.1"
    port: int = 6001


class GelloTestRequest(BaseModel):
    port: str  # e.g. "COM3" (Windows) or "/dev/ttyUSB0" (Linux)


class RobotUsbTestRequest(BaseModel):
    port: str
    baudrate: int = 115200


class TeleopStartRequest(BaseModel):
    gello_port: str
    robot_host: str = "127.0.0.1"
    robot_port: int = 6001
    robot_usb_port: Optional[str] = None  # When set, bypass ZMQ and use direct USB


def zmq_robot_request(host: str, port: int, method: str, args: dict = None) -> any:
    """Send a single pickle request to gello_software ZMQ robot server (REP)."""
    ctx = zmq.Context()
    sock = ctx.socket(zmq.REQ)
    addr = f"tcp://{host}:{port}"
    sock.setsockopt(zmq.RCVTIMEO, 3000)
    sock.setsockopt(zmq.LINGER, 0)
    try:
        sock.connect(addr)
        req = {"method": method, "args": args or {}}
        sock.send(pickle.dumps(req))
        raw = sock.recv()
        out = pickle.loads(raw)
        return out
    finally:
        sock.close()
        ctx.term()


@app.post("/api/test/robot")
def test_robot(req: RobotTestRequest):
    """Test ZMQ connection to gello robot node (num_dofs)."""
    try:
        num_dofs = zmq_robot_request(req.host, req.port, "num_dofs")
        if not isinstance(num_dofs, int):
            return {"ok": False, "error": f"Unexpected response: {type(num_dofs)}"}
        return {"ok": True, "num_dofs": num_dofs}
    except zmq.Again:
        return {"ok": False, "error": "ZMQ 超时，请确认机械臂节点已启动且地址/端口正确"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get("/api/test/robot/state")
def get_robot_state(host: str = "127.0.0.1", port: int = 6001):
    """Get observations from robot (get_observations) for state params display."""
    try:
        obs = zmq_robot_request(host, port, "get_observations")
        if isinstance(obs, dict) and "error" in obs:
            raise HTTPException(status_code=502, detail=obs["error"])
        # Convert numpy arrays/scalars to JSON-serializable
        out = {}
        for k, v in obs.items():
            if hasattr(v, "tolist"):
                out[k] = v.tolist()
            elif hasattr(v, "item"):
                out[k] = v.item()
            else:
                out[k] = v
        return out
    except zmq.Again:
        raise HTTPException(status_code=504, detail="ZMQ 超时")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/test/gello/ports")
def list_gello_ports():
    """List available serial ports for auto-detect (e.g. GELLO)."""
    try:
        from serial.tools import list_ports
        ports = [p.device for p in list_ports.comports()]
        return {"ok": True, "ports": ports}
    except Exception as e:
        return {"ok": False, "ports": [], "error": str(e)}


@app.get("/api/test/usb/ports/detail")
def list_usb_ports_detail():
    """List all COM ports with description/hwid for diagnostics when robot not detected."""
    try:
        from serial.tools import list_ports
        comports = list(list_ports.comports())
        items = []
        for p in comports:
            items.append({
                "port": p.device,
                "description": getattr(p, "description", "") or "",
                "hwid": getattr(p, "hwid", "") or "",
                "manufacturer": getattr(p, "manufacturer", "") or "",
                "product": getattr(p, "product", "") or "",
            })
        return {"ok": True, "devices": items}
    except Exception as e:
        return {"ok": False, "devices": [], "error": str(e)}


def _is_gello_port(port: str, baudrate: int = 57600) -> bool:
    """Return True if port responds to Dynamixel ping (ID 1)."""
    try:
        from dynamixel_sdk.port_handler import PortHandler
        from dynamixel_sdk.packet_handler import PacketHandler
        from dynamixel_sdk.robotis_def import COMM_SUCCESS
    except ImportError:
        return False
    ph = PortHandler(port)
    pk = PacketHandler(2.0)
    try:
        if not ph.openPort():
            return False
        if not ph.setBaudRate(baudrate):
            ph.closePort()
            return False
        _, result, _ = pk.ping(ph, 1)
        ph.closePort()
        return result == COMM_SUCCESS
    except Exception:
        try:
            ph.closePort()
        except Exception:
            pass
        return False


@app.get("/api/test/usb/identify")
def identify_usb_ports():
    """List all COM ports and identify which is GELLO (Dynamixel) vs robot (other)."""
    try:
        from serial.tools import list_ports
        comports = list(list_ports.comports())
    except Exception as e:
        return {"ok": False, "devices": [], "error": str(e)}
    devices = []
    for p in comports:
        is_gello = _is_gello_port(p.device)
        devices.append({
            "port": p.device,
            "description": getattr(p, "description", "") or "",
            "is_gello": is_gello,
            "label": "GELLO 控制器" if is_gello else "机械臂 (USB)",
        })
    return {"ok": True, "devices": devices}


@app.post("/api/test/robot/usb")
def test_robot_usb(req: RobotUsbTestRequest):
    """Test robot USB connection: open serial port, then close."""
    try:
        import serial
        s = serial.Serial(port=req.port, baudrate=req.baudrate, timeout=0.5)
        s.close()
        return {"ok": True, "port": req.port}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.post("/api/test/gello")
def test_gello(req: GelloTestRequest):
    """Test GELLO USB serial connection: open port at 57600 (Dynamixel default), then close."""
    try:
        import serial
        s = serial.Serial(port=req.port, baudrate=57600, timeout=0.5)
        s.close()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def _read_single_servo_p2(port_handler, packet_handler, dxl_id: int, addr: int = 132):
    """Read 4-byte present position from one servo (Protocol 2.0). Returns (value_rad, None) or (None, error)."""
    from dynamixel_sdk.robotis_def import COMM_SUCCESS
    # read4ByteTxRx returns (data_value, comm_result, dxl_error)
    dxl_present_pos, dxl_comm_result, _ = packet_handler.read4ByteTxRx(
        port_handler, dxl_id, addr
    )
    if dxl_comm_result != COMM_SUCCESS:
        err_str = getattr(
            packet_handler, "getTxRxResult", lambda _: str(_)
        )(dxl_comm_result)
        return None, f"ID {dxl_id}: {err_str}"
    raw = dxl_present_pos
    if raw > 0x7FFFFFFF:
        raw -= 0x100000000
    return raw / 2048.0 * 3.141592653589793, None


def _read_gello_joints_once(
    port: str,
    baudrate: int = 57600,
    joint_ids: tuple = (1, 2, 3, 4, 5, 6, 7),
):
    """One-shot read of present position (rad) for given Dynamixel IDs. Uses GroupSyncRead, falls back to single-servo read."""
    try:
        from dynamixel_sdk.port_handler import PortHandler
        from dynamixel_sdk.packet_handler import PacketHandler
        from dynamixel_sdk.group_sync_read import GroupSyncRead
        from dynamixel_sdk.robotis_def import COMM_SUCCESS
    except ImportError as e:
        return None, f"dynamixel-sdk 未安装: {e}. 请运行 pip install dynamixel-sdk"
    ADDR_PRESENT_POSITION = 132
    LEN_PRESENT_POSITION = 4
    port_handler = PortHandler(port)
    packet_handler = PacketHandler(2.0)
    last_err = ""
    try:
        if not port_handler.openPort():
            return None, f"无法打开串口 {port}，请确认 GELLO 已连接且未被其他程序占用"
        if not port_handler.setBaudRate(baudrate):
            port_handler.closePort()
            return None, "设置波特率失败"
        # Try GroupSyncRead first
        for try_ids in (joint_ids, (1, 2, 3, 4, 5, 6)):
            group_read = GroupSyncRead(
                port_handler, packet_handler, ADDR_PRESENT_POSITION, LEN_PRESENT_POSITION
            )
            for dxl_id in try_ids:
                if not group_read.addParam(dxl_id):
                    break
            else:
                result = group_read.txRxPacket()
                if result == COMM_SUCCESS:
                    joints_rad = []
                    for dxl_id in try_ids:
                        if group_read.isAvailable(
                            dxl_id, ADDR_PRESENT_POSITION, LEN_PRESENT_POSITION
                        ):
                            raw = group_read.getData(
                                dxl_id, ADDR_PRESENT_POSITION, LEN_PRESENT_POSITION
                            )
                            if raw > 0x7FFFFFFF:
                                raw -= 0x100000000
                            joints_rad.append(raw / 2048.0 * 3.141592653589793)
                        else:
                            joints_rad.append(0.0)
                    while len(joints_rad) < 7:
                        joints_rad.append(0.0)
                    port_handler.closePort()
                    return joints_rad, None
                last_err = getattr(
                    packet_handler, "getTxRxResult", lambda _: str(_)
                )(result) if hasattr(packet_handler, "getTxRxResult") else "txRxPacket failed"
            if try_ids == (1, 2, 3, 4, 5, 6):
                break
        # Fallback: read each ID one by one (single-servo read often works when GroupSyncRead fails)
        for try_ids in (joint_ids, (1, 2, 3, 4, 5, 6)):
            joints_rad = []
            ok = True
            for dxl_id in try_ids:
                val, err = _read_single_servo_p2(
                    port_handler, packet_handler, dxl_id, ADDR_PRESENT_POSITION
                )
                if err is not None:
                    last_err = err
                    ok = False
                    break
                joints_rad.append(val)
            if ok and joints_rad:
                while len(joints_rad) < 7:
                    joints_rad.append(0.0)
                port_handler.closePort()
                return joints_rad, None
        port_handler.closePort()
        return None, f"读取失败（{last_err}）。请确认：1) GELLO 已上电 2) 波特率 57600 3) 总线上存在对应 ID"
    except Exception as e:
        try:
            port_handler.closePort()
        except Exception:
            pass
        return None, str(e)


@app.get("/api/test/gello/scan")
def scan_gello_ids(port: str = "COM3", baudrate: int = 57600):
    """Ping IDs 1-12 to find which Dynamixel servos respond. Helps diagnose '读取失败'."""
    try:
        from dynamixel_sdk.port_handler import PortHandler
        from dynamixel_sdk.packet_handler import PacketHandler
        from dynamixel_sdk.robotis_def import COMM_SUCCESS
    except ImportError:
        return {"ok": False, "ids": [], "error": "dynamixel-sdk 未安装"}
    ph = PortHandler(port)
    pk = PacketHandler(2.0)
    try:
        if not ph.openPort():
            return {"ok": False, "ids": [], "error": f"无法打开串口 {port}"}
        if not ph.setBaudRate(baudrate):
            ph.closePort()
            return {"ok": False, "ids": [], "error": "设置波特率失败"}
        found = []
        for dxl_id in range(1, 13):
            _, result, _ = pk.ping(ph, dxl_id)
            if result == COMM_SUCCESS:
                found.append(dxl_id)
        ph.closePort()
        return {"ok": True, "ids": found}
    except Exception as e:
        try:
            ph.closePort()
        except Exception:
            pass
        return {"ok": False, "ids": [], "error": str(e)}


def _parse_ids_param(ids: str):
    """Parse ids query: '1-7' -> (1,2,3,4,5,6,7), '1-6' -> (1,2,3,4,5,6), 'auto' or '' -> None (use default)."""
    if not ids or ids.strip().lower() == "auto":
        return None
    s = ids.strip()
    if s == "1-7":
        return (1, 2, 3, 4, 5, 6, 7)
    if s == "1-6":
        return (1, 2, 3, 4, 5, 6)
    if "," in s:
        try:
            return tuple(int(x.strip()) for x in s.split(",") if x.strip())
        except ValueError:
            return None
    return None


@app.get("/api/test/gello/state")
def get_gello_state(port: str = "COM3", baudrate: int = 0, ids: str = "auto"):
    """Read GELLO joint positions. ids: auto (try 1-7 then 1-6), 1-7, 1-6, or 1,2,3,4,5,6."""
    try:
        joint_ids = _parse_ids_param(ids)
        for b in (baudrate,) if baudrate else (57600, 1000000):
            joints, err = _read_gello_joints_once(
                port, baudrate=b, joint_ids=joint_ids if joint_ids is not None else (1, 2, 3, 4, 5, 6, 7)
            )
            if err is None:
                return {"ok": True, "joints": joints}
            if baudrate:
                break
        return {"ok": False, "joints": [], "error": err}
    except Exception as e:
        return {"ok": False, "joints": [], "error": str(e)}


# --- Teleop: GELLO (leader) controls robot (follower) ---
try:
    from teleop_runner import start_teleop, stop_teleop, get_teleop_state
except ImportError:
    start_teleop = stop_teleop = get_teleop_state = None


@app.post("/api/test/teleop/start")
def api_teleop_start(req: TeleopStartRequest):
    """Start GELLO->robot teleop. With robot_usb_port: direct USB (bypass ZMQ). Else: ZMQ (quick_run)."""
    if start_teleop is None:
        raise HTTPException(status_code=503, detail="teleop_runner 未加载")
    ok, err = start_teleop(
        req.gello_port,
        req.robot_host,
        req.robot_port,
        robot_usb_port=req.robot_usb_port,
    )
    if not ok:
        raise HTTPException(status_code=400, detail=err or "启动失败")
    return {"ok": True}


@app.post("/api/test/teleop/stop")
def api_teleop_stop():
    if stop_teleop is None:
        raise HTTPException(status_code=503, detail="teleop_runner 未加载")
    stop_teleop()
    return {"ok": True}


@app.get("/api/test/teleop/state")
def api_teleop_state():
    """Get leader (GELLO) and follower (robot) state for 20ms polling."""
    if get_teleop_state is None:
        raise HTTPException(status_code=503, detail="teleop_runner 未加载")
    return get_teleop_state()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
