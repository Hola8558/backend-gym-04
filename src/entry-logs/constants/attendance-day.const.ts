/** Upper bound for an unmark range: one local day plus DST/timezone slack. */
export const ATTENDANCE_DAY_MAX_RANGE_MS = 26 * 60 * 60 * 1000;

/** Tolerance for client/server clock skew when marking "now". */
export const ATTENDANCE_CLOCK_SKEW_MS = 5 * 60 * 1000;
