import type { KioskCustomerCandidate } from '../types/kiosk-customer-candidate.type';
import { normalizeSearchText } from './normalize-search-text.util';

/**
 * `normalizedQuery` must come from `normalizeSearchText`.
 * Name: every query token is the start of some name/last-name word ("jua pe" → "Juan Pérez").
 * Email: single-token query that prefixes the email.
 */
export function matchesKioskSearch(
  normalizedQuery: string,
  candidate: KioskCustomerCandidate,
): boolean {
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  if (tokens.length === 0) {
    return false;
  }

  const words = normalizeSearchText(
    `${candidate.profile?.name ?? ''} ${candidate.profile?.lastName ?? ''}`,
  )
    .split(' ')
    .filter(Boolean);
  if (tokens.every((token) => words.some((word) => word.startsWith(token)))) {
    return true;
  }

  const email = normalizeSearchText(candidate.email);
  return tokens.length === 1 && email.length > 0 && email.startsWith(tokens[0]);
}
