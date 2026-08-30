import { MenuTagMetrics } from '../types/menu-tag-metrics.type';

/** Same as Angular `menuRoundInt` / metrics bar. */
export function roundMenuTagMetrics(tags: MenuTagMetrics): MenuTagMetrics {
  return {
    fats: Math.round(Number(tags.fats) || 0),
    protein: Math.round(Number(tags.protein) || 0),
    carbs: Math.round(Number(tags.carbs) || 0),
    kcal: Math.round(Number(tags.kcal) || 0),
    foods: Math.round(Number(tags.foods) || 0),
    ingredients: Math.round(Number(tags.ingredients) || 0),
  };
}
