import type { MobileRoutineWeight } from '../types/mobile-routine-weight.type';
import { readRoutineNumber } from './read-routine-number.util';

/** Stored `weight` text + `isKg` flag -> `{ weight, isKg }`; omitted when there is no weight. */
export function readRoutineWeight(
  rawWeight: unknown,
  rawIsKg: unknown,
): MobileRoutineWeight | undefined {
  const weight = readRoutineNumber(rawWeight);
  if (weight === undefined) {
    return undefined;
  }
  return { weight, isKg: rawIsKg !== false };
}
