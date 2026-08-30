/**
 * Joins a catalog folder prefix with a still index (`0` | `1`) → absolute JPG URL.
 */
export function buildExerciseStillAbsoluteUrl(
  folderUrl: string,
  stillIndex: 0 | 1,
): string {
  const base = folderUrl.trim().replace(/\/+$/, '').replace(/\/[01]\.jpe?g$/i, '');
  return `${base}/${stillIndex}.jpg`;
}
