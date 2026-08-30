import type { Ingredient } from '@prisma/client';

export function buildIngredientMap(
  ingredients: Ingredient[],
): Map<number, Ingredient> {
  return new Map(
    ingredients.map((row) => [row.idIngredient, row] as const),
  );
}
