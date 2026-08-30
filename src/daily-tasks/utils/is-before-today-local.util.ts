/** True when the timestamp is null or strictly before today at local midnight. */
export function isBeforeTodayLocal(value: Date | null | undefined): boolean {
  if (value == null) {
    return true;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return value.getTime() < startOfToday.getTime();
}

/** Milliseconds until the next local midnight (for cache reset scheduling). */
export function msUntilNextLocalMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime() - now.getTime();
}
