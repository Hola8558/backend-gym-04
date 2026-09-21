/**
 * Features that unlock customer directory reads (list/search/detail/deleted/banned).
 * Keep in sync with frontend FEATURES_CATALOG: CUSTOMERS_READ, ROUTINES_BUILD,
 * SOLO_COACH_SESSIONS_WRITE, SOLO_COACH_ROUTINES_BUILD.
 */
export const CUSTOMER_READ_FEATURES = [5009, 5011, 5004, 5012] as const;
