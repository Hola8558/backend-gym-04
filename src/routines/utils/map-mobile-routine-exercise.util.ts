import type { ExerciseCatalogFields } from '../../exercises/types/exercise-catalog-fields.type';
import type { MobileRoutineCircuitExercise } from '../types/mobile-routine-circuit-exercise.type';
import { readRoutineCount } from './read-routine-count.util';
import { readRoutineText } from './read-routine-text.util';
import { readRoutineWeight } from './read-routine-weight.util';

/** Stored exercise row + its catalog entry -> mobile exercise (catalog fields, then prescription). */
export function mapMobileRoutineExercise(
  row: Record<string, unknown>,
  idExercise: number,
  catalog: ExerciseCatalogFields | undefined,
): MobileRoutineCircuitExercise {
  return {
    ...(catalog ?? {}),
    id_exercise: idExercise,
    reps: readRoutineCount(row.reps),
    weight: readRoutineWeight(row.weight, row.isKg),
    notes: readRoutineText(row.notes),
    exc: readRoutineText(row.eccentric),
    conc: readRoutineText(row.concentric),
    iso: readRoutineText(row.isometric),
  };
}
