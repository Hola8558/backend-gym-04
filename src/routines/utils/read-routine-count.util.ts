import { readRoutineNumber } from './read-routine-number.util';
import { readRoutineText } from './read-routine-text.util';

/** Series / reps: number when numeric, the coach's free text otherwise ("8-10"), else omitted. */
export function readRoutineCount(raw: unknown): number | string | undefined {
  return readRoutineNumber(raw) ?? readRoutineText(raw);
}
