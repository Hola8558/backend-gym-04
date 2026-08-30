/**
 * Folder prefixes that may appear in `exercises.url` for a still at `{folder}/0.jpg|1.jpg`.
 */
export function catalogMediaFolderCandidates(imageUrl: string): string[] {
  const stripped = imageUrl.replace(/\/[01]\.jpe?g$/i, '').replace(/\/+$/, '');
  if (!stripped) {
    return [];
  }
  return [`${stripped}/`, stripped];
}
