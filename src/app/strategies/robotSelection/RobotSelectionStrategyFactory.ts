/**
 * Factory Pattern: create appropriate selection strategy from robot + controller.
 */
import type { IRobotSelectionStrategy } from './IRobotSelectionStrategy';
import { SingleArmSelectionStrategy } from './SingleArmSelectionStrategy';
import { DualArmSelectionStrategy } from './DualArmSelectionStrategy';

export function createRobotSelectionStrategy(
  isDualArm: boolean,
  controllerId: string
): IRobotSelectionStrategy {
  if (isDualArm) {
    return new DualArmSelectionStrategy(controllerId);
  }
  return new SingleArmSelectionStrategy();
}
