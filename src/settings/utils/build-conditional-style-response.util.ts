import type { StyleCachedKeys } from '../types/style-cached-keys.type';
import type { StyleDbRecord } from '../types/style-db-record.type';
import type { StyleRecord } from './style-response.mapper';

function cachedKeyMatches(
  incomingKey: string | undefined,
  dbKey: string | null,
): boolean {
  if (incomingKey === undefined || incomingKey === '') {
    return false;
  }

  return incomingKey === dbKey;
}

export function buildConditionalStyleRecord(
  db: StyleDbRecord,
  cachedKeys: StyleCachedKeys,
): StyleRecord {
  const logoMatches = cachedKeyMatches(cachedKeys.logoKey, db.logoKeyChange);
  const colorMatches = cachedKeyMatches(
    cachedKeys.colorKey,
    db.colorKeyChange,
  );
  const nameMatches = cachedKeyMatches(cachedKeys.nameKey, db.nameKeyChange);

  return {
    logo: logoMatches ? null : db.logo,
    logoKey: logoMatches ? null : db.logoKeyChange,
    primaryColor: colorMatches ? null : db.primaryColor,
    colorKey: colorMatches ? null : db.colorKeyChange,
    gymName: nameMatches ? null : db.gymName,
    nameKey: nameMatches ? null : db.nameKeyChange,
  };
}
