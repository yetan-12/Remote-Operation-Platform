/**
 * Single Arm Selection Strategy: one robot, one controller, one device.
 */
import type { IRobotSelectionStrategy, SelectionState, SessionPayload } from './IRobotSelectionStrategy';

const CONTROLLER_NAMES: Record<string, string> = {
  GAMEPAD: '手柄',
  GELLOW: 'GELLO',
  VR: 'VR',
};

export class SingleArmSelectionStrategy implements IRobotSelectionStrategy {
  readonly requiresDualDeviceSelection = false;

  validateSelection(state: SelectionState): boolean {
    return !!(state.arm1Robot && state.arm1Controller && state.arm1Device);
  }

  buildSessionPayload(state: SelectionState): SessionPayload {
    return {
      arm1Device: state.arm1Device,
      arm2Device: state.arm1Device,
      arm1Controller: state.arm1Controller,
      arm2Controller: '',
      armMode: 'single',
    };
  }

  getControllerDisplayName(controllerId: string): string {
    return CONTROLLER_NAMES[controllerId] ?? controllerId;
  }
}
