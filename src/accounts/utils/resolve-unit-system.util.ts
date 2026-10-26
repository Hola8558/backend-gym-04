import { DEFAULT_UNIT_SYSTEM, type UnitSystem } from '../types/unit-system.type';

/** Null and unknown values stay on metric so older account rows keep working. */
export function resolveUnitSystem(value: string | null | undefined): UnitSystem {
  return value === 'imperial' ? 'imperial' : DEFAULT_UNIT_SYSTEM;
}
