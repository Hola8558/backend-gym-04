import type { ExerciseCatalogFields } from '../../exercises/types/exercise-catalog-fields.type';
import type { MobileRoutineCircuitExercise } from '../types/mobile-routine-circuit-exercise.type';
import type { MobileRoutineItem } from '../types/mobile-routine-item.type';
import { mapMobileRoutineExercise } from './map-mobile-routine-exercise.util';
import { readRoutineCount } from './read-routine-count.util';
import { readRoutineExerciseId } from './read-routine-exercise-id.util';
import { readRoutineText } from './read-routine-text.util';
import { sortRoutineRows } from './sort-routine-rows.util';

/** Stored day row -> mobile item; `null` for rows that cannot be rendered (no exercise). */
export function mapMobileRoutineItem(
  row: Record<string, unknown>,
  catalogById: ReadonlyMap<number, ExerciseCatalogFields>,
): MobileRoutineItem | null {
  if (row.type === 'circuit') {
    const exercises = sortRoutineRows(row.exercises)
      .map((sub) => mapExercise(sub, catalogById))
      .filter((sub): sub is MobileRoutineCircuitExercise => sub !== null);
    return {
      type: 'circuit',
      name: readRoutineText(row.name),
      series: readRoutineCount(row.series),
      reps: readRoutineCount(row.reps),
      notes: readRoutineText(row.notes),
      exercises,
    };
  }

  const exercise = mapExercise(row, catalogById);
  if (!exercise) {
    return null;
  }
  const { reps, weight, notes, exc, conc, iso, ...identity } = exercise;
  return {
    type: 'standalone_exercise',
    ...identity,
    series: readRoutineCount(row.series),
    reps,
    weight,
    notes,
    exc,
    conc,
    iso,
  };
}

function mapExercise(
  row: Record<string, unknown>,
  catalogById: ReadonlyMap<number, ExerciseCatalogFields>,
): MobileRoutineCircuitExercise | null {
  const idExercise = readRoutineExerciseId(row);
  if (idExercise === undefined) {
    return null;
  }
  return mapMobileRoutineExercise(row, idExercise, catalogById.get(idExercise));
}
