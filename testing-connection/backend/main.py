"""
Testing connection backend. High decoupling via design patterns.
- Observer: EventBus for loose coupling
- Strategy: Teleop modes (ZMQ, USB, SharedBus)
- Service: RobotService, GelloService, TeleopService
- Command: StartTeleopCommand
- Dependency Injection: services injected into API layer
"""
from typing import Optional

import zmq
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.events import get_event_bus
from core.services.robot_service import RobotService
from core.services.gello_service import GelloService
from core.services.gello_state_service import read_gello_joints, scan_gello_ids, parse_ids_param
from core.services.teleop_service import TeleopService

# --- Dependency Injection ---
_event_bus = get_event_bus()
_robot_service = RobotService(event_bus=_event_bus)
_gello_service = GelloService(event_bus=_event_bus)
_teleop_service = TeleopService(event_bus=_event_bus)

app = FastAPI(title="Testing Connection API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request Models ---
class RobotTestRequest(BaseModel):
    host: str = "127.0.0.1"
    port: int = 6001


class GelloTestRequest(BaseModel):
    port: str


class RobotUsbTestRequest(BaseModel):
    port: str
    baudrate: int = 115200


class TeleopStartRequest(BaseModel):
    gello_port: str
    robot_host: str = "127.0.0.1"
    robot_port: int = 6001
    robot_usb_port: Optional[str] = None


# --- API: Robot ---
@app.post("/api/test/robot")
def test_robot(req: RobotTestRequest):
    return _robot_service.test_zmq_connection(req.host, req.port)


@app.get("/api/test/robot/state")
def get_robot_state(host: str = "127.0.0.1", port: int = 6001):
    try:
        return _robot_service.get_robot_observations(host, port)
    except zmq.Again:
        raise HTTPException(status_code=504, detail="ZMQ 超时")
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/api/test/robot/usb")
def test_robot_usb(req: RobotUsbTestRequest):
    try:
        import serial
        s = serial.Serial(port=req.port, baudrate=req.baudrate, timeout=0.5)
        s.close()
        return {"ok": True, "port": req.port}
    except Exception as e:
        return {"ok": False, "error": str(e)}


# --- API: GELLO ---
@app.get("/api/test/gello/ports")
def list_gello_ports():
    return _gello_service.list_ports()


@app.get("/api/test/usb/ports/detail")
def list_usb_ports_detail():
    return _gello_service.list_ports_detail()


@app.get("/api/test/usb/identify")
def identify_usb_ports():
    return _gello_service.identify_ports()


@app.post("/api/test/gello")
def test_gello(req: GelloTestRequest):
    return _gello_service.test_gello(req.port)


@app.get("/api/test/gello/scan")
def scan_gello_ids_endpoint(port: str = "COM3", baudrate: int = 57600):
    return scan_gello_ids(port, baudrate)


@app.get("/api/test/gello/state")
def get_gello_state(port: str = "COM3", baudrate: int = 0, ids: str = "auto"):
    joint_ids = parse_ids_param(ids) or (1, 2, 3, 4, 5, 6, 7)
    err = None
    for b in (baudrate,) if baudrate else (57600, 1000000):
        joints, err = read_gello_joints(port, baudrate=b, joint_ids=joint_ids)
        if err is None:
            return {"ok": True, "joints": joints}
        if baudrate:
            break
    return {"ok": False, "joints": [], "error": err}


# --- API: Teleop ---
@app.post("/api/test/teleop/start")
def api_teleop_start(req: TeleopStartRequest):
    ok, err = _teleop_service.start(
        req.gello_port,
        req.robot_host,
        req.robot_port,
        req.robot_usb_port,
    )
    if not ok:
        raise HTTPException(status_code=400, detail=err or "启动失败")
    return {"ok": True}


@app.post("/api/test/teleop/stop")
def api_teleop_stop():
    _teleop_service.stop()
    return {"ok": True}


@app.get("/api/test/teleop/state")
def api_teleop_state():
    return _teleop_service.get_state()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
