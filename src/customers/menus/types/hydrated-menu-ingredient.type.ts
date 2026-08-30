/** Flat-merged ingredient row returned inside hydrated menu `data`. */
export interface HydratedMenuIngredient {
  kind: 'ingredient';
  quantity: number;
  id_ingredient: number;
  name_es: string | null;
  name_en: string | null;
  emoji: string | null;
  /** Macros for the assigned `quantity` (g), integer-rounded (not per 100g). */
  fat: number | null;
  protein: number | null;
  carbs: number | null;
  kcal: number | null;
  weight_per_unit: number | null;
}
