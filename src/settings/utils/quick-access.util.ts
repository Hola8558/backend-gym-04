import { BadRequestException } from '@nestjs/common';

export const QUICK_ACCESS_VIEW_PATTERN = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/;
export const QUICK_ACCESS_NAME_MAX = 40;
export const QUICK_ACCESS_PER_VIEW_MAX = 5;
export const QUICK_ACCESS_SHORTCUT_MAX = 5;
export const QUICK_ACCESS_FILTERS_MAX = 16;

export type QuickAccessValue = string | number | boolean | null;
export type QuickAccessFilters = Record<string, QuickAccessValue>;

export interface QuickAccessEntry {
  id: string;
  name: string;
  filters: QuickAccessFilters;
}

/** Points at one saved filter. The filter values live only under `filters`. */
export interface QuickAccessShortcut {
  id: string;
  view: string;
}

export interface QuickAccessDocument {
  filters: Record<string, QuickAccessEntry[]>;
  qaccess: QuickAccessShortcut[];
}

export function readQuickAccessDocument(value: unknown): {
  document: QuickAccessDocument;
  changed: boolean;
} {
  const empty: QuickAccessDocument = { filters: {}, qaccess: [] };
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return { document: empty, changed: false };
  }
  const record = value as Record<string, unknown>;
  const shaped = 'filters' in record || 'qaccess' in record;
  const views = readViews(shaped ? record['filters'] : record);
  const shortcuts = readShortcuts(shaped ? record['qaccess'] : [], views.filters);
  const changed = !shaped || views.changed || shortcuts.changed || legacyKeysRemain(record);
  return {
    document: { filters: views.filters, qaccess: shortcuts.shortcuts },
    changed,
  };
}

export function assertQuickAccessView(view: string): string {
  const trimmed = view.trim();
  if (!QUICK_ACCESS_VIEW_PATTERN.test(trimmed)) {
    throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_VIEW_INVALID');
  }
  return trimmed;
}

export function normalizeQuickAccessName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) {
    throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_NAME_REQUIRED');
  }
  if (name.length > QUICK_ACCESS_NAME_MAX) {
    throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_NAME_TOO_LONG');
  }
  return name;
}

export function normalizeQuickAccessFilters(value: unknown): QuickAccessFilters {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_FILTERS_INVALID');
  }
  const out: QuickAccessFilters = {};
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0 || entries.length > QUICK_ACCESS_FILTERS_MAX) {
    throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_FILTERS_INVALID');
  }
  for (const [key, raw] of entries) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)) {
      throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_FILTERS_INVALID');
    }
    out[key] = normalizeFilterValue(raw);
  }
  return out;
}

function readViews(value: unknown): {
  filters: Record<string, QuickAccessEntry[]>;
  changed: boolean;
} {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return { filters: {}, changed: value != null };
  }
  const filters: Record<string, QuickAccessEntry[]> = {};
  let changed = false;
  for (const [view, rawEntries] of Object.entries(value as Record<string, unknown>)) {
    if (!QUICK_ACCESS_VIEW_PATTERN.test(view) || !Array.isArray(rawEntries)) {
      changed = true;
      continue;
    }
    const entries: QuickAccessEntry[] = [];
    for (const raw of rawEntries) {
      const entry = readEntry(raw);
      if (!entry || entries.some((item) => item.id === entry.id)) {
        changed = true;
        continue;
      }
      entries.push(entry);
    }
    if (entries.length > QUICK_ACCESS_PER_VIEW_MAX) {
      changed = true;
      entries.length = QUICK_ACCESS_PER_VIEW_MAX;
    }
    if (entries.length > 0) {
      filters[view] = entries;
    } else if (rawEntries.length > 0) {
      changed = true;
    }
  }
  return { filters, changed };
}

function readShortcuts(
  value: unknown,
  filters: Record<string, QuickAccessEntry[]>,
): { shortcuts: QuickAccessShortcut[]; changed: boolean } {
  if (value == null) {
    return { shortcuts: [], changed: false };
  }
  if (!Array.isArray(value)) {
    return { shortcuts: [], changed: true };
  }
  const shortcuts: QuickAccessShortcut[] = [];
  let changed = false;
  for (const raw of value) {
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
      changed = true;
      continue;
    }
    const record = raw as Record<string, unknown>;
    const id = record['id'];
    const view = record['view'];
    const known =
      typeof id === 'string' &&
      typeof view === 'string' &&
      QUICK_ACCESS_VIEW_PATTERN.test(view) &&
      (filters[view] ?? []).some((entry) => entry.id === id);
    if (!known || shortcuts.some((item) => item.id === id && item.view === view)) {
      changed = true;
      continue;
    }
    if (shortcuts.length >= QUICK_ACCESS_SHORTCUT_MAX) {
      changed = true;
      continue;
    }
    shortcuts.push({ id, view });
  }
  return { shortcuts, changed };
}

function legacyKeysRemain(record: Record<string, unknown>): boolean {
  return Object.keys(record).some(
    (key) => key !== 'filters' && key !== 'qaccess' && QUICK_ACCESS_VIEW_PATTERN.test(key),
  );
}

function readEntry(value: unknown): QuickAccessEntry | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record['id'] !== 'string' || typeof record['name'] !== 'string') {
    return null;
  }
  try {
    return {
      id: record['id'],
      name: record['name'],
      filters: normalizeQuickAccessFilters(record['filters'] ?? {}),
    };
  } catch {
    return null;
  }
}

function normalizeFilterValue(value: unknown): QuickAccessValue {
  if (value == null) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 80) {
      throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_FILTERS_INVALID');
    }
    return trimmed;
  }
  throw new BadRequestException('SETTINGS.ERRORS.QUICK_ACCESS_FILTERS_INVALID');
}
