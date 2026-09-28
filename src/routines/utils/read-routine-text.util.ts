/** Trimmed non-empty text, or `undefined` so the key is omitted from JSON. */
export function readRoutineText(raw: unknown): string | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw);
  }
  if (typeof raw !== 'string') {
    return undefined;
  }
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}
