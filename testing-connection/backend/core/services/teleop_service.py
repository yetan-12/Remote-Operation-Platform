"""
Teleop Service: orchestrates teleop via Strategy + Command patterns.
Uses EventBus for observer notifications; StateProvider for polling.
"""
import threading
from typing import Any, Dict, Optional, Tuple

from ..events import EventBus, get_event_bus
from ..strategies.teleop_strategies import BaseTeleopStrategy, TeleopStrategyFactory


class StartTeleopCommand:
    """Command Pattern: encapsulate teleop start as executable command."""

    def __init__(
        self,
        gello_port: str,
        robot_host: str = "127.0.0.1",
        robot_port: int = 6001,
        robot_usb_port: Optional[str] = None,
        event_bus: Optional[EventBus] = None,
    ):
        self._gello_port = gello_port
        self._robot_host = robot_host
        self._robot_port = robot_port
        self._robot_usb_port = robot_usb_port
        self._event_bus = event_bus or get_event_bus()

    def execute(self) -> Tuple[bool, Optional[str]]:
        # Validation
        try:
            from serial.tools import list_ports
            avail = [p.device for p in list_ports.comports()]
        except Exception:
            avail = []
        if self._gello_port not in avail:
            return False, f"GELLO 串口 '{self._gello_port}' 不存在。当前可用: {', '.join(avail) or '无'}。"
        if self._robot_usb_port and self._robot_usb_port.upper() != "SAME" and self._robot_usb_port not in avail:
            return False, (
                f"机械臂串口 '{self._robot_usb_port}' 不存在。当前可用: {', '.join(avail) or '无'}。"
                "若 GELLO 与机械臂在同一总线，请将机械臂串口选为与 GELLO 相同以使用单口模式。"
            )
        return True, None


class TeleopService:
    """
    Orchestrates teleop: selects strategy, runs in thread, provides state.
    Observer: publishes events; API polls state via get_state().
    """

    def __init__(self, event_bus: Optional[EventBus] = None):
        self._event_bus = event_bus or get_event_bus()
        self._strategy: Optional[BaseTeleopStrategy] = None
        self._thread: Optional[threading.Thread] = None

    @property
    def is_running(self) -> bool:
        return self._strategy is not None and self._strategy._running

    def start(
        self,
        gello_port: str,
        robot_host: str = "127.0.0.1",
        robot_port: int = 6001,
        robot_usb_port: Optional[str] = None,
    ) -> Tuple[bool, Optional[str]]:
        """Start teleop. Returns (ok, error_message)."""
        if self.is_running:
            return False, "遥操作已在运行"
        cmd = StartTeleopCommand(gello_port, robot_host, robot_port, robot_usb_port, self._event_bus)
        ok, err = cmd.execute()
        if not ok:
            return False, err
        strategy = TeleopStrategyFactory.create(gello_port, robot_usb_port)
        self._strategy = strategy
        self._thread = threading.Thread(
            target=strategy.run,
            args=(gello_port, robot_host, robot_port, robot_usb_port),
            kwargs={"hz": 50},
            daemon=True,
        )
        self._thread.start()
        return True, None

    def stop(self) -> None:
        """Stop teleop."""
        if self._strategy:
            self._strategy.stop()
            self._strategy = None
        self._thread = None

    def get_state(self) -> Dict[str, Any]:
        """Get current teleop state for API polling."""
        if self._strategy:
            return self._strategy.get_state()
        return {
            "running": False,
            "leader_joints": [],
            "follower_obs": {},
            "error": None,
        }
