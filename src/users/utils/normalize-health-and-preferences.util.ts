import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HealthAndPreferences } from '../types/health-and-preferences.type';

const INVALID = 'CUSTOMERS.FORM.ERRORS.HEALTH_PREFERENCES_INVALID';

export function readHealthAndPreferences(value: unknown): HealthAndPreferences {
  const stored = readStoredHealthPreferences(value);
  const out: HealthAndPreferences = {};
  for (const [key, items] of Object.entries(stored)) {
    if (items.length > 0) {
      out[key] = items;
    }
  }
  return out;
}

/** Keeps only non-empty lists whose names are active on the account. */
export function healthAndPreferencesForCreate(
  value: unknown,
  allowed: ReadonlySet<string>,
): Prisma.InputJsonValue | undefined {
  const incoming = readIncomingHealthPreferences(value);
  const stored: HealthAndPreferences = {};
  for (const [key, items] of Object.entries(incoming)) {
    if (!allowed.has(key) || items.length === 0) {
      continue;
    }
    stored[key] = items;
  }
  return Object.keys(stored).length > 0 ? stored : undefined;
}

/**
 * Updates the lists the client sent when they belong to the account.
 * Keys that are not in the payload stay, so a hidden or deleted list keeps its items.
 */
export function mergeHealthAndPreferences(
  existing: unknown,
  incoming: unknown,
  allowed: ReadonlySet<string>,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  const stored = readStoredHealthPreferences(existing);
  const next = readIncomingHealthPreferences(incoming);
  for (const [key, items] of Object.entries(next)) {
    if (!allowed.has(key)) {
      continue;
    }
    if (items.length === 0) {
      delete stored[key];
    } else {
      stored[key] = items;
    }
  }
  return Object.keys(stored).length > 0 ? stored : Prisma.JsonNull;
}

function readStoredHealthPreferences(value: unknown): HealthAndPreferences {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const out: HealthAndPreferences = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      continue;
    }
    const items = normalizeItemList(raw);
    if (items.length > 0) {
      out[trimmedKey] = items;
    }
  }
  return out;
}

function readIncomingHealthPreferences(value: unknown): HealthAndPreferences {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException(INVALID);
  }
  const out: HealthAndPreferences = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const trimmedKey = key.trim();
    if (!trimmedKey || !Array.isArray(raw)) {
      throw new BadRequestException(INVALID);
    }
    out[trimmedKey] = normalizeItemList(raw);
  }
  return out;
}

function normalizeItemList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const items: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') {
      continue;
    }
    const trimmed = entry.trim();
    if (!trimmed || trimmed.length > 80 || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    items.push(trimmed);
  }
  return items;
}
