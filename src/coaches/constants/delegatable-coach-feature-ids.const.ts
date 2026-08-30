/** Feature IDs an account owner may delegate to coaches (must match `features` rows). */
export const DELEGATABLE_COACH_FEATURE_IDS = [
  5005, 5009, 5010, 5011,
] as const;

export type DelegatableCoachFeatureId =
  (typeof DELEGATABLE_COACH_FEATURE_IDS)[number];

export const DELEGATABLE_COACH_FEATURE_ID_SET = new Set<number>(
  DELEGATABLE_COACH_FEATURE_IDS,
);
