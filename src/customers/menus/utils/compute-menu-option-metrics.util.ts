import { MenuTagMetrics } from '../types/menu-tag-metrics.type';

const EMPTY: MenuTagMetrics = {
  fats: 0,
  protein: 0,
  carbs: 0,
  kcal: 0,
  foods: 0,
  ingredients: 0,
};

/**
 * Sums metrics for one option/platter's items.
 * Mirrors web `computeMenuMetrics` against hydrated Flutter payload.
 */
export function computeMenuOptionMetrics(items: unknown[]): MenuTagMetrics {
  if (!Array.isArray(items) || items.length === 0) {
    return { ...EMPTY };
  }

  let fats = 0;
  let protein = 0;
  let carbs = 0;
  let kcal = 0;
  let foods = 0;
  let ingredients = 0;

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }
    const item = raw as Record<string, unknown>;
    if (item['kind'] === 'recipe') {
      const macros = asMacroObject(item['macros']);
      fats += macros.fats;
      protein += macros.protein;
      carbs += macros.carbs;
      kcal +=
        macros.kcal != null
          ? macros.kcal
          : recipeKcal(item, macros);
      foods += 1;
      continue;
    }
    if (item['kind'] === 'ingredient') {
      fats += num(item['fat']);
      protein += num(item['protein']);
      carbs += num(item['carbs']);
      kcal += num(item['kcal']);
      ingredients += 1;
    }
  }

  return {
    fats,
    protein,
    carbs,
    kcal,
    foods,
    ingredients,
  };
}

function recipeKcal(
  item: Record<string, unknown>,
  macros: { fats: number; protein: number; carbs: number },
): number {
  const nested = item['ingredients'];
  if (Array.isArray(nested) && nested.length > 0) {
    let sum = 0;
    let used = false;
    for (const ing of nested) {
      if (!ing || typeof ing !== 'object') {
        continue;
      }
      const k = (ing as Record<string, unknown>)['kcal'];
      if (k != null && Number.isFinite(Number(k))) {
        used = true;
        sum += Number(k) || 0;
      }
    }
    if (used) {
      return sum;
    }
  }
  return macros.fats * 9 + macros.protein * 4 + macros.carbs * 4;
}

function asMacroObject(raw: unknown): {
  fats: number;
  protein: number;
  carbs: number;
  kcal: number | null;
} {
  if (!raw || typeof raw !== 'object') {
    return { fats: 0, protein: 0, carbs: 0, kcal: null };
  }
  const m = raw as Record<string, unknown>;
  const kcalRaw = m['kcal'];
  return {
    fats: num(m['fats'] ?? m['fat']),
    protein: num(m['protein']),
    carbs: num(m['carbs'] ?? m['carb']),
    kcal:
      kcalRaw != null && Number.isFinite(Number(kcalRaw))
        ? Number(kcalRaw)
        : null,
  };
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
