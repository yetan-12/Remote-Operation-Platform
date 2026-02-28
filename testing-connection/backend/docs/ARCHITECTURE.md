# Backend Architecture - Design Patterns for High Decoupling

## Overview

The backend uses several design patterns to achieve loose coupling and maintainability.

## Design Patterns Used

### 1. Observer Pattern (EventBus)

**Location:** `core/events.py`

- **EventBus**: Singleton central event bus for pub/sub
- **Event**: Immutable event payload with type and data
- **EventType**: Domain events (TELEOP_STARTED, ROBOT_CONNECTED, etc.)

Components publish events without knowing subscribers. Subscribers react to events without direct dependency on publishers.

```python
event_bus = get_event_bus()
event_bus.subscribe(EventType.TELEOP_STATE_UPDATED, my_callback)
event_bus.publish(Event(EventType.TELEOP_STARTED, {"mode": "zmq"}))
```

### 2. Strategy Pattern (Teleop Modes)

**Location:** `core/strategies/teleop_strategies.py`

- **BaseTeleopStrategy**: Abstract base with state + EventBus
- **ZMQTeleopStrategy**: GELLO (USB) -> Robot (ZMQ)
- **USBSharedBusTeleopStrategy**: Single port, IDs 1-7 (leader) + 8-14 (follower)
- **USBDualPortTeleopStrategy**: Two USB ports (GELLO + robot)
- **TeleopStrategyFactory**: Creates appropriate strategy from config

Each teleop mode is a separate strategy; adding a new mode does not modify existing code.

### 3. Service Layer

**Location:** `core/services/`

- **RobotService**: Robot connection testing (ZMQ)
- **GelloService**: GELLO port listing, identification, connection test
- **GelloStateService**: Read joint positions from GELLO (scan, state)
- **TeleopService**: Orchestrates teleop via Strategy, provides state for API polling

Services encapsulate business logic; API layer only wires requests to services.

### 4. Command Pattern

**Location:** `core/services/teleop_service.py`

- **StartTeleopCommand**: Encapsulates validation + execution for teleop start

Operations are represented as objects; can be queued, logged, or undone if needed.

### 5. Protocol / Interface (Dependency Inversion)

**Location:** `core/interfaces.py`

- **RobotProtocol**: Interface for robot (ZMQ or Dynamixel)
- **LeaderProtocol**: Interface for leader device (GELLO)
- **TeleopStrategy**: Abstract strategy interface
- **StateProvider**: Interface for state polling

Components depend on abstractions, not concrete implementations.

### 6. Dependency Injection

**Location:** `main.py`

- EventBus, RobotService, GelloService, TeleopService are created at startup
- Services receive EventBus via constructor
- API handlers use injected service instances

Enables testing with mocks and swapping implementations.

### 7. Factory Pattern

**Location:** `core/strategies/teleop_strategies.py`

- **TeleopStrategyFactory.create()**: Returns correct strategy based on config (gello_port, robot_usb_port)

Centralizes object creation logic.

## Directory Structure

```
backend/
  main.py                 # Thin API layer, DI wiring
  core/
    events.py             # Observer: EventBus
    interfaces.py         # Protocols (Strategy, Robot, Leader)
    services/
      robot_service.py
      gello_service.py
      gello_state_service.py
      teleop_service.py
    strategies/
      teleop_strategies.py  # ZMQ, USB, SharedBus strategies
  lib/                    # Hardware adapters (unchanged)
```

## Extending the System

- **New teleop mode**: Add a new `*TeleopStrategy` class and register in `TeleopStrategyFactory`
- **New event type**: Add to `EventType` enum and publish from relevant components
- **New API endpoint**: Add route in `main.py`, delegate to appropriate service
- **New observer**: `event_bus.subscribe(EventType.XXX, callback)`
