/**
 * Dual Arm Selection Strategy:
 * - VR/GELLOW: one device (shared, supports both hands)
 * - GAMEPAD: two devices (left + right arm)
 */
import type { IRobotSelectionStrategy, SelectionState, SessionPayload } from './IRobotSelectionStrategy';

const CONTROLLER_NAMES: Record<string, string> = {
  GAMEPAD: '手柄',
  GELLOW: 'GELLO',
  VR: 'VR',
};

export class DualArmSelectionStrategy implements IRobotSelectionStrategy {
  readonly requiresDualDeviceSelection: boolean;

  constructor(controllerId: string) {
    this.requiresDualDeviceSelection = controllerId === 'GAMEPAD';
  }

  validateSelection(state: SelectionState): boolean {
    if (!state.arm1Robot || !state.arm1Controller || !state.arm1Device) return false;
    if (this.requiresDualDeviceSelection && !state.arm2Device) return false;
    return true;
  }

  buildSessionPayload(state: SelectionState): SessionPayload {
    const needsTwoDevices = this.requiresDualDeviceSelection;
    return {
      arm1Device: state.arm1Device,
      arm2Device: needsTwoDevices ? state.arm2Device : state.arm1Device,
      arm1Controller: state.arm1Controller,
      arm2Controller: state.arm1Controller,
      armMode: 'double',
    };
  }

  getControllerDisplayName(controllerId: string): string {
    return CONTROLLER_NAMES[controllerId] ?? controllerId;
  }
}
