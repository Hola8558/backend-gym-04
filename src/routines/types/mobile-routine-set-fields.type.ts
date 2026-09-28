import type { MobileRoutineWeight } from './mobile-routine-weight.type';

/**
 * Prescription fields of one exercise. Absent keys mean "not set" (never `""`).
 * `reps` is a number unless the coach typed free text (e.g. "8-10").
 */
export type MobileRoutineSetFields = {
  reps?: number | string;
  weight?: MobileRoutineWeight;
  notes?: string;
  exc?: string;
  conc?: string;
  iso?: string;
};
