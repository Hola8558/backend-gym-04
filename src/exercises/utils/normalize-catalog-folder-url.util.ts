/** Normalizes an exercise catalog `url` to a folder path without trailing slash. */
export function normalizeCatalogFolderUrl(
  folderUrl: string | null | undefined,
): string | null {
  let raw = folderUrl?.trim() || '';
  if (!raw) {
    return null;
  }
  raw = raw.replace(/\/+$/, '');
  raw = raw.replace(/\/[01]\.jpe?g$/i, '');
  raw = raw.replace(/\/+$/, '');
  return raw.length > 0 ? raw : null;
}
