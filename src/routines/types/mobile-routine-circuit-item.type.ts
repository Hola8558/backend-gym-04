import type { MobileRoutineCircuitExercise } from './mobile-routine-circuit-exercise.type';

export type MobileRoutineCircuitItem = {
  type: 'circuit';
  name?: string;
  series?: number | string;
  reps?: number | string;
  notes?: string;
  exercises: MobileRoutineCircuitExercise[];
};
