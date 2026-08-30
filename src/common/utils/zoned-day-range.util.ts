/** Wall clock components in a given IANA time zone (not UTC). */
export type ZonedWallClock = {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  s: number;
};

export function isValidIanaTimeZone(timeZone: string): boolean {
  if (!timeZone || timeZone.length > 120) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/**
 * Under `hourCycle: 'h23'`, some engines (e.g. Node + ICU) format local midnight as hour **24**
 * instead of 0. We normalize so wall-clock math matches civil "start of day" (h = 0).
 */
function normalizeH23Hour(hour: number): number {
  return hour === 24 ? 0 : hour;
}

export function readWallClock(epochMs: number, timeZone: string): ZonedWallClock {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  });
  const o: Record<string, number> = {};
  for (const p of f.formatToParts(new Date(epochMs))) {
    if (p.type !== 'literal') {
      o[p.type] = Number(p.value);
    }
  }
  return {
    y: o.year,
    m: o.month,
    d: o.day,
    h: normalizeH23Hour(o.hour),
    mi: o.minute,
    s: o.second,
  };
}

function compareWall(a: ZonedWallClock, b: ZonedWallClock): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  if (a.d !== b.d) return a.d - b.d;
  if (a.h !== b.h) return a.h - b.h;
  if (a.mi !== b.mi) return a.mi - b.mi;
  return a.s - b.s;
}

/**
 * Finds a UTC instant whose wall clock in `timeZone` equals `target`.
 * Scans minute-by-minute around a UTC anchor (KISS, no extra deps).
 */
function findUtcMatchingWallClock(target: ZonedWallClock, timeZone: string): Date {
  const anchor = Date.UTC(target.y, target.m - 1, target.d, target.h, target.mi, target.s);
  for (let offsetMin = -40 * 60; offsetMin <= 40 * 60; offsetMin += 1) {
    const t = anchor + offsetMin * 60_000;
    const w = readWallClock(t, timeZone);
    if (w.y !== target.y || w.m !== target.m || w.d !== target.d || w.h !== target.h || w.mi !== target.mi) {
      continue;
    }
    for (let u = t - 60_000; u <= t + 60_000; u += 1000) {
      if (compareWall(readWallClock(u, timeZone), target) === 0) {
        return new Date(u);
      }
    }
  }
  throw new Error(`ZONED_WALL_CLOCK_NOT_FOUND:${JSON.stringify(target)}:${timeZone}`);
}

function civilGregorianPlusOneDay(y: number, m: number, d: number): { y: number; m: number; d: number } {
  const u = new Date(Date.UTC(y, m - 1, d + 1));
  return { y: u.getUTCFullYear(), m: u.getUTCMonth() + 1, d: u.getUTCDate() };
}

/**
 * [start, endExclusive) in UTC that correspond to the caller's "today" in `timeZone`.
 */
export function getZonedCalendarDayRangeUtc(
  now: Date,
  timeZone: string,
): { start: Date; endExclusive: Date } {
  const { y, m, d } = readWallClock(now.getTime(), timeZone);
  const start = findUtcMatchingWallClock({ y, m, d, h: 0, mi: 0, s: 0 }, timeZone);
  const next = civilGregorianPlusOneDay(y, m, d);
  const endExclusive = findUtcMatchingWallClock(
    { y: next.y, m: next.m, d: next.d, h: 0, mi: 0, s: 0 },
    timeZone,
  );
  return { start, endExclusive };
}

/** Local hour (0–23) for bucketing; minutes are not used for the 2h slot index. */
export function getLocalHourInZone(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(instant);
  const hourPart = parts.find((p) => p.type === 'hour')?.value ?? '00';
  return normalizeH23Hour(Number.parseInt(hourPart, 10));
}
