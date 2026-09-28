import type { ExerciseCatalogFields } from '../../exercises/types/exercise-catalog-fields.type';
import type { MobileRoutineSetFields } from './mobile-routine-set-fields.type';

/** Catalog fields are absent when the exercise no longer exists in the catalog. */
export type MobileRoutineCircuitExercise = Partial<ExerciseCatalogFields> &
  Pick<ExerciseCatalogFields, 'id_exercise'> &
  MobileRoutineSetFields;
