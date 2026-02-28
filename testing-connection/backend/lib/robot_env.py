"""RobotEnv for testing-connection. Minimal env wrapping a robot for step/get_obs."""
import time
from typing import Any, Dict, Optional

import numpy as np


class Rate:
    def __init__(self, rate: float):
        self.last = time.time()
        self.rate = rate

    def sleep(self):
        while self.last + 1.0 / self.rate > time.time():
            time.sleep(0.0001)
        self.last = time.time()


class RobotEnv:
    """Environment wrapping a robot (e.g. ZMQClientRobot) with step/get_obs."""

    def __init__(self, robot, control_rate_hz: float = 100.0):
        self._robot = robot
        self._rate = Rate(control_rate_hz)

    def step(self, joints: np.ndarray) -> Dict[str, Any]:
        assert len(joints) == self._robot.num_dofs()
        self._robot.command_joint_state(joints)
        self._rate.sleep()
        return self.get_obs()

    def get_obs(self) -> Dict[str, Any]:
        robot_obs = self._robot.get_observations()
        # Ensure keys expected by teleop
        return {
            "joint_positions": robot_obs.get("joint_positions", robot_obs.get("joint_state", np.zeros(7))),
            "joint_velocities": robot_obs.get("joint_velocities", np.zeros(self._robot.num_dofs())),
            "ee_pos_quat": robot_obs.get("ee_pos_quat", np.zeros(7)),
            "gripper_position": robot_obs.get("gripper_position", np.array(0.0)),
        }
