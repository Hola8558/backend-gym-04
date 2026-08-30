import { Ingredient } from '@prisma/client';
import { HydratedMenuIngredient } from '../types/hydrated-menu-ingredient.type';
import { coerceMenuIngredientId } from './coerce-menu-ingredient-id.util';
import { scaleMacrosForQuantity } from './scale-macros-for-quantity.util';

/**
 * Deep-clones menu JSON and flat-merges full ingredient rows into every
 * `kind === 'ingredient'` object. Nutrition fields are scaled to `quantity`.
 * Missing DB ids keep a null-field placeholder.
 */
export function hydrateMenuIngredients(
  data: unknown,
  byId: Map<number, Ingredient>,
): Record<string, unknown> {
  const cloned = structuredClone(data) as unknown;
  const hydrated = hydrateNode(cloned, byId);
  if (
    hydrated &&
    typeof hydrated === 'object' &&
    !Array.isArray(hydrated)
  ) {
    return hydrated as Record<string, unknown>;
  }
  return {};
}

function hydrateNode(node: unknown, byId: Map<number, Ingredient>): unknown {
  if (node == null) {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((entry) => hydrateNode(entry, byId));
  }
  if (typeof node !== 'object') {
    return node;
  }

  const row = node as Record<string, unknown>;
  if (row['kind'] === 'ingredient') {
    return toHydratedIngredient(row, byId);
  }

  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    next[key] = hydrateNode(value, byId);
  }
  return next;
}

function toHydratedIngredient(
  row: Record<string, unknown>,
  byId: Map<number, Ingredient>,
): HydratedMenuIngredient {
  const quantity = Number(row['quantity']) || 0;
  const id = coerceMenuIngredientId(row);
  const db = id != null ? byId.get(id) : undefined;

  if (db) {
    return {
      kind: 'ingredient',
      quantity,
      id_ingredient: db.idIngredient,
      name_es: db.nameEs,
      name_en: db.nameEn,
      emoji: db.emoji,
      fat: scaleMacrosForQuantity(db.fat100g, quantity),
      protein: scaleMacrosForQuantity(db.protein100g, quantity),
      carbs: scaleMacrosForQuantity(db.carbs100g, quantity),
      kcal: scaleMacrosForQuantity(db.kcalPer100g, quantity),
      weight_per_unit: db.weightPerUnit,
    };
  }

  return {
    kind: 'ingredient',
    quantity,
    id_ingredient: id ?? 0,
    name_es: null,
    name_en: null,
    emoji: null,
    fat: null,
    protein: null,
    carbs: null,
    kcal: null,
    weight_per_unit: null,
  };
}
