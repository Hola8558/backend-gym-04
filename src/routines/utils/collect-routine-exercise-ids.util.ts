import { ROUTINE_WEEK_DAY_KEYS } from '../constants/routine-week-day-keys.const';
import { asJsonRecord } from './as-json-record.util';
import { readRoutineExerciseId } from './read-routine-exercise-id.util';

/** Unique catalog ids referenced by stored weeks (standalone rows and circuit children). */
export function collectRoutineExerciseIds(rawWeeks: readonly unknown[]): number[] {
  const ids = new Set<number>();

  const visit = (node: unknown): void => {
    const row = asJsonRecord(node);
    if (!row) {
      return;
    }
    const id = readRoutineExerciseId(row);
    if (id !== undefined) {
      ids.add(id);
    }
    if (Array.isArray(row.exercises)) {
      row.exercises.forEach(visit);
    }
  };

  for (const rawWeek of rawWeeks) {
    const week = asJsonRecord(rawWeek);
    if (!week) {
      continue;
    }
    for (const day of ROUTINE_WEEK_DAY_KEYS) {
      const rows = week[day];
      if (Array.isArray(rows)) {
        rows.forEach(visit);
      }
    }
  }

  return [...ids];
}
