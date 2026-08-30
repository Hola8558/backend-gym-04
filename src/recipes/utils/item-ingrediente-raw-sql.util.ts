import { Prisma } from '@prisma/client';
import type { ItemIngrediente } from '../types/item-ingrediente.type';

/**
 * Infrastructure helpers for recipes.ingredientes_cantidades (item_ingrediente[]).
 * Prisma cannot natively map composite arrays — use $queryRaw / $executeRaw.
 */

/** Builds: ARRAY[ROW(1, 100)::item_ingrediente, ROW(2, 50)::item_ingrediente]::item_ingrediente[] */
export function buildItemIngredienteArraySql(
  items: readonly ItemIngrediente[],
): Prisma.Sql {
  if (items.length === 0) {
    return Prisma.sql`ARRAY[]::item_ingrediente[]`;
  }

  const rows = items.map(
    (item) =>
      Prisma.sql`ROW(${item.ingrediente_id}, ${item.gramos})::item_ingrediente`,
  );

  return Prisma.sql`ARRAY[${Prisma.join(rows)}]::item_ingrediente[]`;
}

/**
 * Example UPDATE (do not call from business logic yet):
 *
 * await prisma.$executeRaw`
 *   UPDATE recipes
 *   SET ingredientes_cantidades = ${buildItemIngredienteArraySql(items)}
 *   WHERE id_recipie = ${idRecipie}
 *     AND id_account = ${idAccount}
 * `;
 *
 * Example INSERT fragment:
 *
 * await prisma.$executeRaw`
 *   INSERT INTO recipes (id_account, name, ingredientes_cantidades)
 *   VALUES (
 *     ${idAccount},
 *     ${name},
 *     ${buildItemIngredienteArraySql(items)}
 *   )
 * `;
 *
 * Equivalent hand-written cast (for docs / psql):
 *   ARRAY[ROW(1, 100), ROW(2, 50)]::item_ingrediente[]
 */

/**
 * SELECT must cast Unsupported composite arrays to text for Prisma:
 *   SELECT ingredientes_cantidades::text AS ingredientes_cantidades
 * Postgres text form looks like: '{"(1,100)","(2,50)"}'
 */
export function parseItemIngredienteArray(
  raw: unknown,
): ItemIngrediente[] {
  if (raw == null) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw.map(normalizeItemIngrediente).filter(isItemIngrediente);
  }

  if (typeof raw !== 'string') {
    return [];
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed === '{}' || trimmed === 'null') {
    return [];
  }

  // node-pg composite-array text: {"(1,100)","(2,50.5)"}
  const withoutBraces = trimmed.replace(/^\{/, '').replace(/\}$/, '');
  if (!withoutBraces) {
    return [];
  }

  const tuples = withoutBraces.match(/\([^)]*\)/g) ?? [];
  return tuples
    .map((tuple) => {
      const inner = tuple.slice(1, -1);
      const [idPart, gramosPart] = inner.split(',');
      const ingrediente_id = Number(idPart);
      const gramos = Number(gramosPart);
      if (!Number.isFinite(ingrediente_id) || !Number.isFinite(gramos)) {
        return null;
      }
      return { ingrediente_id, gramos };
    })
    .filter((item): item is ItemIngrediente => item != null);
}

function normalizeItemIngrediente(value: unknown): ItemIngrediente | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  const ingrediente_id = Number(
    row.ingrediente_id ?? row.ingredienteId ?? row[0],
  );
  const gramos = Number(row.gramos ?? row[1]);
  if (!Number.isFinite(ingrediente_id) || !Number.isFinite(gramos)) {
    return null;
  }
  return { ingrediente_id, gramos };
}

function isItemIngrediente(value: ItemIngrediente | null): value is ItemIngrediente {
  return value != null;
}
