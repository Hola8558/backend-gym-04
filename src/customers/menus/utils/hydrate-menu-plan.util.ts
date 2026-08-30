import type { Ingredient } from '@prisma/client';
import { attachMenuTags } from './attach-menu-tags.util';
import { hydrateMenuIngredients } from './hydrate-menu-ingredients.util';

/** Hydrate ingredient rows + recompute tags for a stored menu `data` blob. */
export function hydrateMenuPlan(
  data: unknown,
  byId: Map<number, Ingredient>,
): Record<string, unknown> {
  const hydrated = hydrateMenuIngredients(data, byId);
  return attachMenuTags(hydrated);
}
