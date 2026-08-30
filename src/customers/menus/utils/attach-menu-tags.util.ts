import { MenuTagMetrics } from '../types/menu-tag-metrics.type';
import { computeAverageOptionMetrics } from './compute-average-option-metrics.util';
import { computeMenuOptionMetrics } from './compute-menu-option-metrics.util';
import { roundMenuTagMetrics } from './round-menu-tag-metrics.util';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/**
 * Recomputes tag snapshots to match the menu creator:
 * - estricto: root `tags[day]` = total for that day
 * - dinamico: `groups[i].tags` = average per option; removes legacy root `tags`
 * Also integer-rounds recipe `macros` so Flutter matches creator chips.
 */
export function attachMenuTags(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const planType = data['planType'];
  const withRoundedRecipes = roundRecipeMacrosInTree(data);

  if (planType === 'estricto') {
    return attachStrictTags(withRoundedRecipes);
  }
  if (planType === 'dinamico') {
    return attachDynamicTags(withRoundedRecipes);
  }
  return withRoundedRecipes;
}

function attachStrictTags(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const daysRaw = data['days'];
  const days =
    daysRaw && typeof daysRaw === 'object' && !Array.isArray(daysRaw)
      ? (daysRaw as Record<string, unknown>)
      : {};

  const nextDays: Record<string, unknown> = { ...days };
  const tags = {} as Record<string, MenuTagMetrics>;
  for (const day of WEEKDAYS) {
    const dayNode = days[day];
    const plattersRaw =
      dayNode && typeof dayNode === 'object'
        ? (dayNode as { platters?: unknown }).platters
        : undefined;
    const platters = Array.isArray(plattersRaw)
      ? plattersRaw.map((platter) => {
          if (!platter || typeof platter !== 'object') {
            return platter;
          }
          const p = platter as Record<string, unknown>;
          return {
            ...p,
            name: normalizeStoredPlatterName(p['name'], {
              isStrictPlatter: true,
            }),
            note: normalizeStoredNote(p['note']),
            timeWindow:
              p['timeWindow'] === null
                ? null
                : normalizeStoredTimeWindow(p['timeWindow']),
          };
        })
      : [];
    const items = flattenPlatterItems(platters);
    tags[day] = roundMenuTagMetrics(computeMenuOptionMetrics(items));
    nextDays[day] = {
      ...(dayNode && typeof dayNode === 'object'
        ? (dayNode as Record<string, unknown>)
        : {}),
      platters,
    };
  }

  return {
    ...data,
    days: nextDays,
    tags,
  };
}

function attachDynamicTags(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const groupsRaw = data['groups'];
  const groups = Array.isArray(groupsRaw) ? groupsRaw : [];

  const nextGroups = groups.map((group) => {
    if (!group || typeof group !== 'object') {
      return group;
    }
    const g = group as Record<string, unknown>;
    const rawOptions = Array.isArray(g['options']) ? g['options'] : [];
    const tags = roundMenuTagMetrics(computeAverageOptionMetrics(rawOptions));
    const options = rawOptions.map((option, optionIndex) => {
      if (!option || typeof option !== 'object') {
        return option;
      }
      const o = option as Record<string, unknown>;
      return {
        ...o,
        name: normalizeStoredPlatterName(o['name'], {
          optionIndex: optionIndex + 1,
        }),
        note: normalizeStoredNote(o['note']),
      };
    });

    const { note: _legacyGroupNote, ...groupWithoutLegacyNote } = g;
    return {
      ...groupWithoutLegacyNote,
      tags,
      // Preserve saved time window (dinámico only).
      timeWindow:
        g['timeWindow'] === null
          ? null
          : normalizeStoredTimeWindow(g['timeWindow']),
      options,
    };
  });

  const rest = { ...data };
  delete rest['tags'];
  return {
    ...rest,
    groups: nextGroups,
  };
}

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function normalizeStoredTimeWindow(
  raw: unknown,
): { from: string; to: string } | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const row = raw as { from?: unknown; to?: unknown };
  const from = typeof row.from === 'string' ? row.from.trim() : '';
  const to = typeof row.to === 'string' ? row.to.trim() : '';
  if (!HH_MM.test(from) || !HH_MM.test(to)) {
    return null;
  }
  return { from, to };
}

function normalizeStoredNote(raw: unknown): string | null {
  if (raw == null || typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Empty / locale-default titles → null (Flutter resolves i18n by plan type). */
function normalizeStoredPlatterName(
  raw: unknown,
  options?: { optionIndex?: number; isStrictPlatter?: boolean },
): string | null {
  if (raw == null || typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const defaults = new Set<string>();
  if (options?.isStrictPlatter) {
    defaults.add('Platter / snack');
    defaults.add('Bloque de alimentación');
  }
  const n = options?.optionIndex;
  if (n != null && n > 0) {
    defaults.add(`Option ${n}`);
    defaults.add(`Opción ${n}`);
  }
  if (defaults.has(trimmed)) {
    return null;
  }
  return trimmed;
}

function flattenPlatterItems(platters: unknown[]): unknown[] {
  const items: unknown[] = [];
  for (const platter of platters) {
    if (!platter || typeof platter !== 'object') {
      continue;
    }
    const list = (platter as { items?: unknown }).items;
    if (Array.isArray(list)) {
      items.push(...list);
    }
  }
  return items;
}

function roundRecipeMacrosInTree(
  data: Record<string, unknown>,
): Record<string, unknown> {
  return walk(data) as Record<string, unknown>;
}

function walk(node: unknown): unknown {
  if (node == null) {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((entry) => walk(entry));
  }
  if (typeof node !== 'object') {
    return node;
  }

  const row = node as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    next[key] = walk(value);
  }

  if (next['kind'] === 'recipe' && next['macros'] && typeof next['macros'] === 'object') {
    const m = next['macros'] as Record<string, unknown>;
    const fats = Math.round(Number(m['fats']) || 0);
    const protein = Math.round(Number(m['protein']) || 0);
    const carbs = Math.round(Number(m['carbs']) || 0);
    const nestedKcal = sumNestedIngredientKcal(next['ingredients']);
    const kcal =
      m['kcal'] != null && Number.isFinite(Number(m['kcal']))
        ? Math.round(Number(m['kcal']))
        : nestedKcal != null
          ? Math.round(nestedKcal)
          : Math.round(fats * 9 + protein * 4 + carbs * 4);
    next['macros'] = { fats, protein, carbs, kcal };
  }

  return next;
}

function sumNestedIngredientKcal(raw: unknown): number | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }
  let sum = 0;
  let used = false;
  for (const ing of raw) {
    if (!ing || typeof ing !== 'object') {
      continue;
    }
    const k = (ing as Record<string, unknown>)['kcal'];
    if (k != null && Number.isFinite(Number(k))) {
      used = true;
      sum += Number(k) || 0;
    }
  }
  return used ? sum : null;
}
