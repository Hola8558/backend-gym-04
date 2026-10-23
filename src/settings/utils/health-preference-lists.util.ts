export const HEALTH_PREFERENCE_DELETED_SUFFIX = '-deleted';
export const HEALTH_PREFERENCE_NAME_MAX = 40;
export const DEFAULT_ACCOUNT_HEALTH_PREFERENCES = ['alergias', 'lesiones'];

export function isDeletedHealthPreference(name: string): boolean {
  return (
    name.endsWith(HEALTH_PREFERENCE_DELETED_SUFFIX) &&
    healthPreferenceBaseName(name).length > 0
  );
}

export function healthPreferenceBaseName(name: string): string {
  return name.endsWith(HEALTH_PREFERENCE_DELETED_SUFFIX)
    ? name.slice(0, -HEALTH_PREFERENCE_DELETED_SUFFIX.length)
    : name;
}

export function activeHealthPreferenceNames(names: readonly string[]): string[] {
  return names.filter((name) => !isDeletedHealthPreference(name));
}

export function splitHealthPreferences(names: readonly string[]): {
  active: string[];
  deleted: string[];
} {
  return {
    active: names.filter((name) => !isDeletedHealthPreference(name)),
    deleted: names.filter((name) => isDeletedHealthPreference(name)),
  };
}

export function joinHealthPreferences(
  active: readonly string[],
  deleted: readonly string[],
): string[] {
  return [...active, ...deleted];
}

export function healthPreferenceNameKey(name: string): string {
  return healthPreferenceBaseName(name).trim().toLocaleLowerCase();
}

/** Trimmed display name, or null when it is empty, too long, or uses the deleted suffix. */
export function normalizeHealthPreferenceName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  if (!name || name.length > HEALTH_PREFERENCE_NAME_MAX) {
    return null;
  }
  if (name.toLocaleLowerCase().endsWith(HEALTH_PREFERENCE_DELETED_SUFFIX)) {
    return null;
  }
  return name;
}
