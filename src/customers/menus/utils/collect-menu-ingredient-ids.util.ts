import { coerceMenuIngredientId } from './coerce-menu-ingredient-id.util';

/**
 * Walks persisted menu JSON and collects every unique numeric id where
 * `kind === 'ingredient'` (platter items and nested recipe ingredients).
 */
export function collectMenuIngredientIds(data: unknown): number[] {
  const ids = new Set<number>();
  walk(data, ids);
  return [...ids];
}

function walk(node: unknown, ids: Set<number>): void {
  if (node == null) {
    return;
  }
  if (Array.isArray(node)) {
    for (const entry of node) {
      walk(entry, ids);
    }
    return;
  }
  if (typeof node !== 'object') {
    return;
  }

  const row = node as Record<string, unknown>;
  if (row['kind'] === 'ingredient') {
    const id = coerceMenuIngredientId(row);
    if (id != null) {
      ids.add(id);
    }
  }

  for (const value of Object.values(row)) {
    walk(value, ids);
  }
}
