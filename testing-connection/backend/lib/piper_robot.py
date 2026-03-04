"""PiperRobot for testing-connection. CAN bus connection to Piper robot arm."""
from typing import Dict, Optional
import time

import numpy as np

# Conversion factor: radians to Piper internal units
FACTOR = 57295.7795

# Global robot instance cache (avoid repeated enable)
_robot_instances: Dict[str, "PiperRobot"] = {}


def get_piper_robot(channel: str = "can_follower", enable: bool = True) -> "PiperRobot":
    """Get or create a PiperRobot instance (singleton per channel)."""
    global _robot_instances
    if channel not in _robot_instances:
        _robot_instances[channel] = PiperRobot(channel, enable=enable)
    return _robot_instances[channel]


class PiperRobot:
    """Piper robot arm via CAN bus (piper_sdk)."""

    def __init__(self, channel: str = "can_follower", enable: bool = True):
        """
        Initialize Piper robot.
        
        Args:
            channel: CAN bus channel name (e.g., "can_follower", "can_master", "can0")
            enable: Whether to enable robot on init (needed for control)
        """
        try:
            from piper_sdk import C_PiperInterface
        except ImportError:
            raise ImportError("piper_sdk 未安装。请运行: pip install piper_sdk")
        
        self._channel = channel
        self._robot = C_PiperInterface(channel)
        self._robot.ConnectPort()
        self._enabled = False
        
        if enable:
            self._enable_robot()
        
        self._joint_state = np.zeros(7)
        self._joint_velocities = np.zeros(7)

    def _enable_robot(self):
        """Enable the robot arm."""
        if self._enabled:
            return
        max_attempts = 5  # Reduced from 10
        for i in range(max_attempts):
            if self._robot.EnablePiper():
                self._enabled = True
                break
            print(f"等待 Piper 使能中... ({i+1}/{max_attempts})")
            time.sleep(0.5)  # Reduced from 1s
        else:
            raise RuntimeError(f"Piper 使能失败，CAN 通道: {self._channel}")

    def ensure_enabled(self):
        """Ensure robot is enabled before control commands."""
        if not self._enabled:
            self._enable_robot()

    def num_dofs(self) -> int:
        return 7  # 6 arm joints + 1 gripper

    def get_joint_state(self) -> np.ndarray:
        """Get current joint positions in radians (gripper normalized to 0-1)."""
        joint_msg = self._robot.GetArmJointMsgs()
        gripper_msg = self._robot.GetArmGripperMsgs()

        joint_state = np.zeros(7)
        for i in range(6):
            joint_state[i] = joint_msg.joint_state.__getattribute__(f"joint_{i+1}")
        joint_state[6] = gripper_msg.gripper_state.grippers_angle

        # Convert: internal units to radians, gripper to 0-1 normalized
        joint_state[:6] = joint_state[:6] / FACTOR
        joint_state[6] = (1 - joint_state[6]) / 1000 / 1000

        self._joint_state = joint_state
        return self._joint_state

    def command_joint_state(self, joint_state: np.ndarray, skip_enable: bool = False) -> None:
        """Command joint positions (radians for joints, 0-1 for gripper)."""
        if not skip_enable:
            self.ensure_enabled()  # Must be enabled before control
        
        assert len(joint_state) == self.num_dofs(), \
            f"Expected {self.num_dofs()} joints, got {len(joint_state)}"

        cmd = np.array(joint_state, dtype=float)
        
        # Convert: radians to internal units, 0-1 to gripper units
        cmd[:6] = cmd[:6] * FACTOR
        cmd[6] = (1 - cmd[6]) * 1000 * 1000
        cmd = cmd.astype(int)

        self._robot.ModeCtrl(0x01, 0x01, 30, 0x00)
        self._robot.JointCtrl(*cmd[:6])
        self._robot.GripperCtrl(abs(cmd[6]), 1000, 0x01, 0)

    def set_torque_mode(self, mode: bool) -> None:
        """Enable/disable torque (Piper handles this internally)."""
        # Piper SDK manages torque through EnablePiper/ModeCtrl
        pass

    def get_observations(self) -> Dict[str, np.ndarray]:
        """Get robot observations."""
        self.get_joint_state()
        return {
            "joint_positions": self._joint_state.tolist(),
            "joint_velocities": self._joint_velocities.tolist(),
            "ee_pos_quat": [0.0] * 7,
            "gripper_position": float(self._joint_state[6]),
        }

    def close(self) -> None:
        """Cleanup (if needed)."""
        pass

    def go_home(self, home_position: Optional[np.ndarray] = None, skip_enable: bool = True, duration: float = 2.0) -> None:
        """
        Move robot to home position by continuously sending commands.
        
        Args:
            home_position: Custom home position (7 joints in radians). If None, uses default zero position.
            skip_enable: Skip enable check (default True for direct control).
            duration: Time in seconds to continuously send commands (default 2.0s).
        """
        import time
        if home_position is None:
            # Default home position (radians): calibrated zero position
            # 关节1=-0.0051, 关节2=-0.0275, 关节3=0.0072, 关节4=0.0000, 
            # 关节5=0.5919, 关节6=0.0100, 夹爪=-0.0117
            home_position = np.array([-0.0051, -0.0275, 0.0072, 0.0000, 0.5919, 0.0100, -0.0117])
        
        # Send commands continuously for the duration
        hz = 50  # 50Hz control rate
        dt = 1.0 / hz
        steps = int(duration * hz)
        
        for _ in range(steps):
            self._command_joint_radians(home_position)
            time.sleep(dt)

    def _command_joint_radians(self, joint_state: np.ndarray) -> None:
        """
        Command joint positions directly in radians (all 7 joints including gripper).
        This is used for go_home where all values are in radians.
        """
        assert len(joint_state) == 7, f"Expected 7 joints, got {len(joint_state)}"
        
        cmd = np.array(joint_state, dtype=float)
        
        # Convert all joints from radians to internal units (including gripper)
        cmd_int = (cmd * FACTOR).astype(int)
        
        self._robot.ModeCtrl(0x01, 0x01, 30, 0x00)
        self._robot.JointCtrl(*cmd_int[:6])
        # Gripper: use angle in internal units, with default speed
        self._robot.GripperCtrl(abs(cmd_int[6]), 1000, 0x01, 0)


def test_piper_connection(channel: str = "can_follower") -> Dict:
    """Test Piper CAN connection."""
    try:
        from piper_sdk import C_PiperInterface
        robot = C_PiperInterface(channel)
        robot.ConnectPort()
        
        # Try to get joint state
        joint_msg = robot.GetArmJointMsgs()
        if joint_msg is None:
            return {"ok": False, "error": f"无法从 {channel} 读取关节状态"}
        
        return {"ok": True, "channel": channel}
    except ImportError:
        return {"ok": False, "error": "piper_sdk 未安装"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def list_can_channels():
    """List available CAN channels."""
    import subprocess
    try:
        result = subprocess.run(
            ["ip", "link", "show"],
            capture_output=True,
            text=True,
            timeout=5
        )
        lines = result.stdout.split("\n")
        channels = []
        for line in lines:
            if "link/can" in line.lower() or "can" in line.lower():
                # Extract interface name
                parts = line.split(":")
                if len(parts) >= 2:
                    name = parts[1].strip().split()[0]
                    if name.startswith("can"):
                        channels.append(name)
        # Also check common names
        for name in ["can_follower", "can_master", "can0", "can1"]:
            if name not in channels:
                try:
                    result = subprocess.run(
                        ["ip", "link", "show", name],
                        capture_output=True,
                        timeout=2
                    )
                    if result.returncode == 0:
                        channels.append(name)
                except Exception:
                    pass
        return list(set(channels))
    except Exception:
        return []
