/**
 * Scales catalog macros/kcal (stored per 100g) to the assigned quantity in grams.
 * Matches the web menus formula: (valuePer100g * quantity) / 100.
 * Integer-rounded like creator chips (`menuRoundInt`).
 */
export function scaleMacrosForQuantity(
  valuePer100g: number | null | undefined,
  quantityGrams: number,
): number | null {
  if (valuePer100g == null || !Number.isFinite(valuePer100g)) {
    return null;
  }
  const grams = Number(quantityGrams) || 0;
  const scaled = (valuePer100g * grams) / 100;
  return Math.round(scaled);
}
