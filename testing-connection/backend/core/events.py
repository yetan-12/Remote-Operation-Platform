"""
Observer Pattern: EventBus for loose coupling between components.
Publishers emit events; subscribers react without direct dependency.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


class EventType(Enum):
    """Domain event types for system-wide observation."""
    TELEOP_STARTED = "teleop_started"
    TELEOP_STOPPED = "teleop_stopped"
    TELEOP_STATE_UPDATED = "teleop_state_updated"
    TELEOP_ERROR = "teleop_error"
    ROBOT_CONNECTED = "robot_connected"
    ROBOT_DISCONNECTED = "robot_disconnected"
    GELLO_CONNECTED = "gello_connected"
    GELLO_DISCONNECTED = "gello_disconnected"


@dataclass
class Event:
    """Immutable event payload."""
    type: EventType
    payload: Dict[str, Any] = field(default_factory=dict)
    source: Optional[str] = None


ObserverCallback = Callable[[Event], None]


class EventBus:
    """
    Central event bus - Singleton for app-wide use.
    Observers subscribe by event type; publishers emit without knowing subscribers.
    """

    _instance: Optional["EventBus"] = None

    def __new__(cls) -> "EventBus":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if getattr(self, "_observers", None) is not None:
            return
        self._observers: Dict[EventType, List[ObserverCallback]] = {
            et: [] for et in EventType
        }
        self._global_observers: List[ObserverCallback] = []

    def subscribe(self, event_type: EventType, callback: ObserverCallback) -> None:
        """Subscribe to a specific event type."""
        if callback not in self._observers[event_type]:
            self._observers[event_type].append(callback)

    def subscribe_all(self, callback: ObserverCallback) -> None:
        """Subscribe to all events."""
        if callback not in self._global_observers:
            self._global_observers.append(callback)

    def unsubscribe(self, event_type: EventType, callback: ObserverCallback) -> None:
        """Remove a subscription."""
        if callback in self._observers[event_type]:
            self._observers[event_type].remove(callback)

    def publish(self, event: Event) -> None:
        """Publish event to all relevant observers."""
        for cb in self._observers[event.type]:
            try:
                cb(event)
            except Exception:
                pass
        for cb in self._global_observers:
            try:
                cb(event)
            except Exception:
                pass

    def reset(self) -> None:
        """Clear all observers (for testing)."""
        for key in self._observers:
            self._observers[key] = []
        self._global_observers = []


def get_event_bus() -> EventBus:
    """Factory for EventBus singleton."""
    return EventBus()
