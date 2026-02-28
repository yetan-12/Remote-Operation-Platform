"""ZMQClientRobot for testing-connection. Connects to quick_run-style ZMQ robot server."""
import pickle
from typing import Dict

import numpy as np
import zmq


class ZMQClientRobot:
    """ZMQ client for robot server (e.g. quick_run)."""

    def __init__(self, port: int = 6001, host: str = "127.0.0.1"):
        self._context = zmq.Context()
        self._socket = self._context.socket(zmq.REQ)
        self._socket.setsockopt(zmq.RCVTIMEO, 3000)
        self._socket.connect(f"tcp://{host}:{port}")

    def _request(self, method: str, args: dict = None):
        req = {"method": method, "args": args or {}}
        self._socket.send(pickle.dumps(req))
        result = pickle.loads(self._socket.recv())
        if isinstance(result, dict) and "error" in result:
            raise RuntimeError(result["error"])
        return result

    def num_dofs(self) -> int:
        return self._request("num_dofs")

    def get_joint_state(self) -> np.ndarray:
        result = self._request("get_joint_state")
        return np.array(result) if not isinstance(result, np.ndarray) else result

    def command_joint_state(self, joint_state) -> None:
        self._request(
            "command_joint_state",
            {"joint_state": joint_state.tolist() if hasattr(joint_state, "tolist") else list(joint_state)},
        )

    def get_observations(self) -> Dict[str, np.ndarray]:
        result = self._request("get_observations")
        out = {}
        for k, v in result.items():
            if hasattr(v, "tolist"):
                out[k] = np.array(v)
            else:
                out[k] = np.array(v) if isinstance(v, (list, tuple)) else np.array([v])
        return out

    def close(self):
        self._socket.close()
        self._context.term()
