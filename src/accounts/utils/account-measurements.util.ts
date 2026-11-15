import { DEFAULT_GLOBAL_MEASUREMENTS } from '../constants/default-global-measurements.const';
import type { AccountMeasurement } from '../types/account-measurement.type';
import type {
  AccountMeasurementActionInput,
  AccountMeasurementPlanError,
} from '../types/account-measurement-action.type';
import {
  GLOBAL_MEASUREMENT_UNIT_TYPES,
  type GlobalMeasurementUnitType,
} from '../types/global-measurement.type';

export const ACCOUNT_MEASUREMENT_LABEL_MAX = 40;

const RESERVED_MEASUREMENT_KEYS = new Set(['weight', 'peso']);

type PlanResult =
  | { ok: true; next: AccountMeasurement[] }
  | { ok: false; error: AccountMeasurementPlanError };

/**
 * Null or a non-array falls back to the starter catalog.
 * A stored array is kept as-is, including when every item is soft-deleted.
 */
export function resolveAccountMeasurements(value: unknown): AccountMeasurement[] {
  if (!Array.isArray(value)) {
    return starterCatalog();
  }

  const items: AccountMeasurement[] = [];
  let recognized = 0;
  for (const item of value) {
    const parsed = parseStoredMeasurement(item);
    if (parsed === 'invalid') {
      recognized += 1;
      continue;
    }
    if (!parsed) {
      continue;
    }
    recognized += 1;
    if (!items.some((current) => current.key === parsed.key)) {
      items.push(parsed);
    }
  }

  return recognized > 0 ? items : starterCatalog();
}

export function activeAccountMeasurements(
  value: unknown,
): Array<Omit<AccountMeasurement, 'deleted_at'>> {
  return resolveAccountMeasurements(value)
    .filter((item) => item.deleted_at == null)
    .map(({ key, label, unit_type }) => ({ key, label, unit_type }));
}

/** Renaming changes the label only. The key stays so client rows are not rewritten. */
export function planAccountMeasurementAction(
  current: readonly AccountMeasurement[],
  action: AccountMeasurementActionInput,
): PlanResult {
  const active = current.filter((item) => item.deleted_at == null);
  const deleted = current.filter((item) => item.deleted_at != null);

  if (action.action === 'add') {
    const labelResult = normalizeMeasurementLabel(action.label);
    if (labelResult.ok === false) {
      return { ok: false, error: labelResult.error };
    }
    const label = labelResult.label;
    if (!isUnitType(action.unitType)) {
      return { ok: false, error: 'METRIC_UNIT_REQUIRED' };
    }
    const key = measurementKeyFromLabel(label);
    if (!key) {
      return { ok: false, error: 'METRIC_NAME_REQUIRED' };
    }
    if (RESERVED_MEASUREMENT_KEYS.has(key)) {
      return { ok: false, error: 'METRIC_NAME_RESERVED' };
    }
    if (keyTaken(current, key) || labelTaken(current, label)) {
      return { ok: false, error: 'METRIC_NAME_TAKEN' };
    }
    return {
      ok: true,
      next: [
        ...active,
        { key, label, unit_type: action.unitType, deleted_at: null },
        ...deleted,
      ],
    };
  }

  if (action.action === 'rename') {
    const currentItem = active.find((item) => item.key === action.key);
    if (!currentItem) {
      return { ok: false, error: 'METRIC_NOT_FOUND' };
    }
    const labelResult = normalizeMeasurementLabel(action.label);
    if (labelResult.ok === false) {
      return { ok: false, error: labelResult.error };
    }
    const label = labelResult.label;
    if (label === currentItem.label) {
      return { ok: true, next: [...current] };
    }
    if (labelTaken(current, label, currentItem.key)) {
      return { ok: false, error: 'METRIC_NAME_TAKEN' };
    }
    return {
      ok: true,
      next: [
        ...active.map((item) =>
          item.key === currentItem.key ? { ...item, label } : item,
        ),
        ...deleted,
      ],
    };
  }

  if (action.action === 'delete') {
    const currentItem = active.find((item) => item.key === action.key);
    if (!currentItem) {
      return { ok: false, error: 'METRIC_NOT_FOUND' };
    }
    return {
      ok: true,
      next: [
        ...active.filter((item) => item.key !== currentItem.key),
        ...deleted,
        { ...currentItem, deleted_at: action.deletedAt },
      ],
    };
  }

  const currentItem = deleted.find((item) => item.key === action.key);
  if (!currentItem) {
    return { ok: false, error: 'METRIC_NOT_FOUND' };
  }
  if (labelTaken(current, currentItem.label, currentItem.key)) {
    return { ok: false, error: 'METRIC_NAME_TAKEN' };
  }
  return {
    ok: true,
    next: [
      ...active,
      { ...currentItem, deleted_at: null },
      ...deleted.filter((item) => item.key !== currentItem.key),
    ],
  };
}

function starterCatalog(): AccountMeasurement[] {
  return DEFAULT_GLOBAL_MEASUREMENTS.map((item) => ({
    key: item.key,
    label: item.label,
    unit_type: item.unit_type,
    deleted_at: null,
  }));
}

function parseStoredMeasurement(
  value: unknown,
): AccountMeasurement | 'invalid' | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const key = typeof row.key === 'string' ? row.key.trim() : '';
  if (!key) {
    return null;
  }
  const label = typeof row.label === 'string' ? row.label.trim() : '';
  const unitType = row.unit_type;
  if (!label || !isUnitType(unitType) || RESERVED_MEASUREMENT_KEYS.has(key)) {
    return 'invalid';
  }
  const deletedAt =
    typeof row.deleted_at === 'string' && row.deleted_at.trim().length > 0
      ? row.deleted_at
      : null;
  return { key, label, unit_type: unitType, deleted_at: deletedAt };
}

function normalizeMeasurementLabel(
  raw: string,
):
  | { ok: true; label: string }
  | { ok: false; error: 'METRIC_NAME_REQUIRED' | 'METRIC_NAME_TOO_LONG' } {
  const label = raw.trim().replace(/\s+/g, ' ');
  if (!label) {
    return { ok: false, error: 'METRIC_NAME_REQUIRED' };
  }
  if (label.length > ACCOUNT_MEASUREMENT_LABEL_MAX) {
    return { ok: false, error: 'METRIC_NAME_TOO_LONG' };
  }
  return { ok: true, label };
}

function measurementKeyFromLabel(label: string): string {
  const ascii = label.normalize('NFD').replace(/\p{M}/gu, '');
  return ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, ACCOUNT_MEASUREMENT_LABEL_MAX);
}

function isUnitType(value: unknown): value is GlobalMeasurementUnitType {
  return (
    typeof value === 'string' &&
    (GLOBAL_MEASUREMENT_UNIT_TYPES as readonly string[]).includes(value)
  );
}

function keyTaken(items: readonly AccountMeasurement[], key: string): boolean {
  return items.some((item) => item.key === key);
}

function labelTaken(
  items: readonly AccountMeasurement[],
  label: string,
  exceptKey?: string,
): boolean {
  const normalized = label.trim().toLocaleLowerCase();
  return items.some(
    (item) =>
      item.key !== exceptKey &&
      item.label.trim().toLocaleLowerCase() === normalized,
  );
}
