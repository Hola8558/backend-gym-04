import { MenuTagMetrics } from '../types/menu-tag-metrics.type';
import { computeMenuOptionMetrics } from './compute-menu-option-metrics.util';

/**
 * Average macros across options in one dinámico group.
 * Same formula as web `computeAverageOptionMetrics`.
 */
export function computeAverageOptionMetrics(
  options: unknown[],
): MenuTagMetrics {
  if (!Array.isArray(options) || options.length === 0) {
    return {
      fats: 0,
      protein: 0,
      carbs: 0,
      kcal: 0,
      foods: 0,
      ingredients: 0,
    };
  }

  let fats = 0;
  let protein = 0;
  let carbs = 0;
  let kcal = 0;
  let foods = 0;
  let ingredients = 0;

  for (const option of options) {
    const items =
      option && typeof option === 'object'
        ? (option as { items?: unknown }).items
        : undefined;
    const m = computeMenuOptionMetrics(Array.isArray(items) ? items : []);
    fats += m.fats;
    protein += m.protein;
    carbs += m.carbs;
    kcal += m.kcal;
    foods += m.foods;
    ingredients += m.ingredients;
  }

  const n = options.length;
  return {
    fats: fats / n,
    protein: protein / n,
    carbs: carbs / n,
    kcal: kcal / n,
    foods: foods / n,
    ingredients: ingredients / n,
  };
}
