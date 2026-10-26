import { DEFAULT_GLOBAL_MEASUREMENTS } from '../../../accounts/constants/default-global-measurements.const';
import type { GlobalMeasurementDefinition } from '../../../accounts/types/global-measurement.type';
import { WEIGHT_METRIC_KEY } from '../types/metric-field.type';

/** Uses the account catalog. A missing or unreadable catalog falls back to the starter list. */
export function readGlobalMeasurements(value: unknown): GlobalMeasurementDefinition[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_GLOBAL_MEASUREMENTS];
  }

  const parsed: GlobalMeasurementDefinition[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const key = typeof row.key === 'string' ? row.key.trim() : '';
    const label = typeof row.label === 'string' ? row.label.trim() : '';
    const unitType = row.unit_type;
    if (!key || !label || key === WEIGHT_METRIC_KEY) {
      continue;
    }
    if (unitType !== 'length' && unitType !== 'percentage') {
      continue;
    }
    parsed.push({ key, label, unit_type: unitType });
  }

  return parsed.length > 0 ? parsed : [...DEFAULT_GLOBAL_MEASUREMENTS];
}
