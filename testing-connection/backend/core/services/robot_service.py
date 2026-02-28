"""
Robot Service: encapsulates robot testing logic.
Uses dependency injection; no direct ZMQ/serial coupling in service.
"""
import pickle
from typing import Any, Callable, Dict, Optional

import zmq

from ..events import Event, EventBus, EventType, get_event_bus


class RobotService:
    """
    Service for robot connection testing.
    Depends on injected request function (Strategy) - can be ZMQ or mock.
    """

    def __init__(self, event_bus: Optional[EventBus] = None):
        self._event_bus = event_bus or get_event_bus()

    def test_zmq_connection(self, host: str, port: int) -> Dict[str, Any]:
        """Test ZMQ connection to robot server."""
        try:
            result = self._zmq_request(host, port, "num_dofs")
            if not isinstance(result, int):
                return {"ok": False, "error": f"Unexpected response: {type(result)}"}
            self._event_bus.publish(Event(EventType.ROBOT_CONNECTED, {"host": host, "port": port}))
            return {"ok": True, "num_dofs": result}
        except zmq.Again:
            return {"ok": False, "error": "ZMQ 超时，请确认机械臂节点已启动且地址/端口正确"}
        except Exception as e:
            self._event_bus.publish(Event(EventType.ROBOT_DISCONNECTED, {"error": str(e)}))
            return {"ok": False, "error": str(e)}

    def get_robot_observations(self, host: str, port: int) -> Dict[str, Any]:
        """Get observations from robot."""
        obs = self._zmq_request(host, port, "get_observations")
        if isinstance(obs, dict) and "error" in obs:
            raise RuntimeError(obs["error"])
        out = {}
        for k, v in obs.items():
            if hasattr(v, "tolist"):
                out[k] = v.tolist()
            elif hasattr(v, "item"):
                out[k] = v.item()
            else:
                out[k] = v
        return out

    @staticmethod
    def _zmq_request(host: str, port: int, method: str, args: Optional[dict] = None) -> Any:
        ctx = zmq.Context()
        sock = ctx.socket(zmq.REQ)
        sock.setsockopt(zmq.RCVTIMEO, 3000)
        sock.setsockopt(zmq.LINGER, 0)
        try:
            sock.connect(f"tcp://{host}:{port}")
            req = {"method": method, "args": args or {}}
            sock.send(pickle.dumps(req))
            return pickle.loads(sock.recv())
        finally:
            sock.close()
            ctx.term()
