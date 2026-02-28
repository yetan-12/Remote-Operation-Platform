/**
 * Strategy Pattern: Robot/Device selection for data collection.
 * Different strategies for Single Arm vs Dual Arm modes.
 */

export interface RobotOption {
  id: string;
  name: string;
  status: 'available' | 'in-use';
  isDual: boolean;
}

export interface ControllerOption {
  id: string;
  name: string;
}

export interface DeviceOption {
  id: string;
  name: string;
  status: 'available' | 'in-use';
}

export interface SelectionState {
  arm1Robot: string;
  arm1Controller: string;
  arm1Device: string;
  arm2Device: string;
}

export interface SessionPayload {
  arm1Device: string;
  arm2Device: string;
  arm1Controller: string;
  arm2Controller: string;
  armMode: 'single' | 'double';
}

export interface IRobotSelectionStrategy {
  /** Whether this strategy requires two device selections (e.g. dual arm + gamepad) */
  readonly requiresDualDeviceSelection: boolean;

  /** Validate if selection is complete and can create session */
  validateSelection(state: SelectionState): boolean;

  /** Build payload for SessionSetup from current selection */
  buildSessionPayload(state: SelectionState): SessionPayload;

  /** Get controller display name mapping */
  getControllerDisplayName(controllerId: string): string;
}
