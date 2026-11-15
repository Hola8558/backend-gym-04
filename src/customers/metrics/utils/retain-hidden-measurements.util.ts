/** Keeps values whose catalog key is soft-deleted so an edit does not erase them. */
export function retainHiddenMeasurements(
  existing: Readonly<Record<string, number>>,
  next: Readonly<Record<string, number>>,
  activeKeys: ReadonlySet<string>,
): Record<string, number> {
  const merged: Record<string, number> = { ...next };
  for (const [key, value] of Object.entries(existing)) {
    if (!activeKeys.has(key) && !Object.prototype.hasOwnProperty.call(merged, key)) {
      merged[key] = value;
    }
  }
  return merged;
}
