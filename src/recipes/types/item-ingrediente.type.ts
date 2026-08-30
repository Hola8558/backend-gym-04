/**
 * Mirrors Postgres composite type:
 * CREATE TYPE item_ingrediente AS (ingrediente_id INT, gramos NUMERIC);
 */
export interface ItemIngrediente {
  ingrediente_id: number;
  gramos: number;
}
