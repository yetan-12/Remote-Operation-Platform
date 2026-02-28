/**
 * Extensible device state schema for testing connection.
 * Supports robot arms, GELLO, grippers, robot hands, and future manipulators.
 */
export type DeviceKind = 'robot_arm' | 'gello' | 'gripper' | 'robot_hand' | 'custom';

export interface DeviceStateConfig {
  kind: DeviceKind;
  label: string;
  /** Joint/servo labels, e.g. ['关节1', '关节2', ..., '夹爪'] or ['finger1', 'finger2'] */
  jointLabels: string[];
  /** Extra scalar or array params (e.g. ee_pos_quat, gripper_position) */
  extraParams?: { key: string; label: string; isArray: boolean }[];
}

/** Default configs for known device types - extend when adding new devices */
export const DEVICE_STATE_CONFIGS: Record<DeviceKind, Omit<DeviceStateConfig, 'label'>> = {
  robot_arm: {
    kind: 'robot_arm',
    jointLabels: [], // Filled from get_observations joint_positions length
    extraParams: [
      { key: 'joint_velocities', label: 'joint_velocities', isArray: true },
      { key: 'ee_pos_quat', label: 'ee_pos_quat', isArray: true },
      { key: 'gripper_position', label: 'gripper_position', isArray: false },
    ],
  },
  gello: {
    kind: 'gello',
    jointLabels: ['关节1', '关节2', '关节3', '关节4', '关节5', '关节6', '夹爪'],
    extraParams: [],
  },
  gripper: {
    kind: 'gripper',
    jointLabels: ['开合'],
    extraParams: [],
  },
  robot_hand: {
    kind: 'robot_hand',
    jointLabels: ['手指1', '手指2', '手指3', '手指4', '手指5'],
    extraParams: [],
  },
  custom: {
    kind: 'custom',
    jointLabels: [],
    extraParams: [],
  },
};
