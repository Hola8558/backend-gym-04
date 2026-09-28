/** Catalog id of a stored routine row (`exercise_id`, legacy `id_exercise`). */
export function readRoutineExerciseId(row: Record<string, unknown>): number | undefined {
  const raw = row.exercise_id ?? row.id_exercise;
  return typeof raw === 'number' && Number.isInteger(raw) ? raw : undefined;
}
