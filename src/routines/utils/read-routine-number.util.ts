import { readRoutineText } from './read-routine-text.util';

const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;

/** Parses stored numeric text ("12", "22,5") into a number; `undefined` when blank or not numeric. */
export function readRoutineNumber(raw: unknown): number | undefined {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : undefined;
  }
  const text = readRoutineText(raw)?.replace(',', '.');
  return text && NUMERIC_PATTERN.test(text) ? Number(text) : undefined;
}
