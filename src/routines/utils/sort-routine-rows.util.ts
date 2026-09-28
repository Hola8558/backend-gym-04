import { asJsonRecord } from './as-json-record.util';

/** Object rows of a stored list, sorted by their `order` (rows without it keep their position). */
export function sortRoutineRows(rows: unknown): Record<string, unknown>[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row, index) => ({ row: asJsonRecord(row), index }))
    .filter((entry): entry is { row: Record<string, unknown>; index: number } => entry.row !== null)
    .sort((a, b) => orderOf(a.row, a.index) - orderOf(b.row, b.index))
    .map((entry) => entry.row);
}

function orderOf(row: Record<string, unknown>, fallback: number): number {
  return typeof row.order === 'number' && Number.isFinite(row.order) ? row.order : fallback;
}
