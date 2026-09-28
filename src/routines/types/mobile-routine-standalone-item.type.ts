import type { MobileRoutineCircuitExercise } from './mobile-routine-circuit-exercise.type';

export type MobileRoutineStandaloneItem = { type: 'standalone_exercise' } & MobileRoutineCircuitExercise & {
    series?: number | string;
  };
