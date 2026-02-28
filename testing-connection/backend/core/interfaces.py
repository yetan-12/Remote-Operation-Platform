"""
Strategy & Protocol interfaces for dependency inversion.
Components depend on abstractions, not concrete implementations.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Protocol, Tuple, runtime_checkable

import numpy as np


@runtime_checkable
class RobotProtocol(Protocol):
    """Protocol for robot (follower) - ZMQ or Dynamixel."""

    def num_dofs(self) -> int:
        ...

    def get_joint_state(self) -> np.ndarray:
        ...

    def command_joint_state(self, joint_state) -> None:
        ...

    def get_observations(self) -> Dict[str, Any]:
        ...


@runtime_checkable
class LeaderProtocol(Protocol):
    """Protocol for leader device (GELLO) - reads joint state."""

    def act(self, obs: Dict[str, Any]) -> np.ndarray:
        """Produce action from observation (may ignore obs for hardware read)."""
        ...


@runtime_checkable
class RobotClientFactory(Protocol):
    """Factory for creating robot clients (Strategy for creation)."""

    def create_zmq_robot(self, host: str, port: int) -> RobotProtocol:
        ...

    def create_usb_robot(self, port: str, baudrate: int, **kwargs) -> RobotProtocol:
        ...


class TeleopStrategy(ABC):
    """
    Strategy Pattern: different teleop execution modes.
    ZMQ, USB, SharedBus are concrete strategies.
    """

    @abstractmethod
    def run(
        self,
        gello_port: str,
        robot_host: str,
        robot_port: int,
        robot_usb_port: Optional[str],
        hz: float,
    ) -> None:
        """Run teleop loop. Blocking until stopped."""
        ...

    @abstractmethod
    def stop(self) -> None:
        """Signal strategy to stop."""
        ...


class StateProvider(ABC):
    """Abstract interface for components that hold mutable state (for polling)."""

    @abstractmethod
    def get_state(self) -> Dict[str, Any]:
        ...


class Command(ABC):
    """Command Pattern: encapsulate operation as object."""

    @abstractmethod
    def execute(self) -> Tuple[bool, Optional[str]]:
        """Execute command. Returns (success, error_message)."""
        ...
