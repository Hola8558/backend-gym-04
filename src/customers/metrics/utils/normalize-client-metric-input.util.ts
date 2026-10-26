import type { GlobalMeasurementDefinition } from '../../../accounts/types/global-measurement.type';
import { WEIGHT_METRIC_KEY } from '../types/metric-field.type';

export interface NormalizedClientMetricInput {
  weight: number | null;
  measurements: Record<string, number>;
}

export type NormalizeClientMetricError = 'INVALID_VALUE' | 'EMPTY';

export function normalizeClientMetricInput(
  weight: unknown,
  measurements: unknown,
  catalog: readonly GlobalMeasurementDefinition[],
): NormalizedClientMetricInput | NormalizeClientMetricError {
  const normalizedWeight = normalizeOptionalNumber(weight, 999.99);
  if (normalizedWeight === 'invalid') {
    return 'INVALID_VALUE';
  }

  if (
    measurements != null &&
    (typeof measurements !== 'object' || Array.isArray(measurements))
  ) {
    return 'INVALID_VALUE';
  }

  const source =
    measurements && typeof measurements === 'object'
      ? (measurements as Record<string, unknown>)
      : {};
  const allowed = new Map(catalog.map((field) => [field.key, field.unit_type]));
  const stored: Record<string, number> = {};

  for (const [key, raw] of Object.entries(source)) {
    if (key === WEIGHT_METRIC_KEY || raw == null || raw === '') {
      continue;
    }
    const unitType = allowed.get(key);
    if (!unitType) {
      continue;
    }
    const max = unitType === 'percentage' ? 100 : 999.99;
    const value = normalizeOptionalNumber(raw, max);
    if (value === 'invalid') {
      return 'INVALID_VALUE';
    }
    if (value != null) {
      stored[key] = value;
    }
  }

  if (normalizedWeight == null && Object.keys(stored).length === 0) {
    return 'EMPTY';
  }

  return { weight: normalizedWeight, measurements: stored };
}

function normalizeOptionalNumber(
  raw: unknown,
  max: number,
): number | null | 'invalid' {
  if (raw == null || raw === '') {
    return null;
  }
  const numeric = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > max) {
    return 'invalid';
  }
  return Math.round(numeric * 100) / 100;
}
