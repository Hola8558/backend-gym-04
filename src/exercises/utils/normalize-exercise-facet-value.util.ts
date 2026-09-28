import { EXERCISE_FACET_VALUE_ALIASES } from '../constants/exercise-facet-value-aliases.const';

/**
 * Canonical facet value for catalog text columns (category, equipment, force, mechanic, level):
 * lowercase snake_case ("e-z curl bar" -> "e_z_curl_bar", "Body Only" -> "body_only"),
 * legacy spellings folded via EXERCISE_FACET_VALUE_ALIASES; blank -> null.
 */
export function normalizeExerciseFacetValue(raw: string | null | undefined): string | null {
  const value = (raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (value.length === 0) {
    return null;
  }
  return EXERCISE_FACET_VALUE_ALIASES[value] ?? value;
}
