"""
Gello Service: encapsulates GELLO (Dynamixel) testing logic.
Decoupled from API; uses event bus for notifications.
"""
from typing import Any, Callable, Dict, List, Optional, Tuple

from ..events import Event, EventBus, EventType, get_event_bus


class GelloService:
    """
    Service for GELLO controller connection and state.
    Hardware-dependent logic isolated; service delegates to adapters.
    """

    def __init__(self, event_bus: Optional[EventBus] = None):
        self._event_bus = event_bus or get_event_bus()

    def list_ports(self) -> Dict[str, Any]:
        """List available serial ports."""
        try:
            from serial.tools import list_ports
            ports = [p.device for p in list_ports.comports()]
            return {"ok": True, "ports": ports}
        except Exception as e:
            return {"ok": False, "ports": [], "error": str(e)}

    def list_ports_detail(self) -> Dict[str, Any]:
        """List COM ports with description/hwid."""
        try:
            from serial.tools import list_ports
            items = []
            for p in list(list_ports.comports()):
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

    def is_gello_port(self, port: str, baudrate: int = 57600) -> bool:
        """Check if port responds to Dynamixel ping (ID 1)."""
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

    def identify_ports(self) -> Dict[str, Any]:
        """Identify which ports are GELLO vs robot."""
        try:
            from serial.tools import list_ports
            comports = list(list_ports.comports())
        except Exception as e:
            return {"ok": False, "devices": [], "error": str(e)}
        devices = []
        for p in comports:
            is_gello = self.is_gello_port(p.device)
            devices.append({
                "port": p.device,
                "description": getattr(p, "description", "") or "",
                "is_gello": is_gello,
                "label": "GELLO 控制器" if is_gello else "机械臂 (USB)",
            })
        return {"ok": True, "devices": devices}

    def test_gello(self, port: str) -> Dict[str, Any]:
        """Test GELLO USB connection."""
        try:
            import serial
            s = serial.Serial(port=port, baudrate=57600, timeout=0.5)
            s.close()
            self._event_bus.publish(Event(EventType.GELLO_CONNECTED, {"port": port}))
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "error": str(e)}
