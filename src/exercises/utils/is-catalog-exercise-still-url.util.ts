/**
 * True when `raw` is an absolute http(s) exercise still URL ending in `/0.jpg` or `/1.jpg`.
 */
export function isCatalogExerciseStillUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    return /\/[01]\.jpe?g$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}
