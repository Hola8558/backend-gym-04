/**
 * Resolves catalog ingredient id from persisted menu JSON rows.
 * Accepts modern `id` / `id_ingredient` and legacy web `catalogId`.
 */
export function coerceMenuIngredientId(row: Record<string, unknown>): number | null {
  const raw = row['id'] ?? row['id_ingredient'] ?? row['catalogId'];
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return Math.trunc(n);
}
