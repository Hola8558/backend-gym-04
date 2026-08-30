export function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

export function addUtcDays(start: Date, days: number): Date {
  const out = new Date(start);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

/** `days` ago from `from` (UTC calendar days). */
export function subUtcDays(from: Date, days: number): Date {
  return addUtcDays(from, -days);
}

/** Whole UTC calendar-day difference from `from` to `to` (both normalized to UTC midnight). */
export function utcWholeCalendarDaysBetween(from: Date, to: Date): number {
  const a = startOfUtcDay(from);
  const b = startOfUtcDay(to);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
