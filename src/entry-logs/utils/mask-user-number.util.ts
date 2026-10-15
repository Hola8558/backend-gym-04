import { KIOSK_USER_NUMBER_VISIBLE_DIGITS } from '../constants/kiosk-search.const';

/** "10693" → "•••93"; null/short values stay fully masked. */
export function maskUserNumber(userNumber: string | null): string {
  const value = (userNumber ?? '').trim();
  if (value.length <= KIOSK_USER_NUMBER_VISIBLE_DIGITS) {
    return '•••';
  }
  return `•••${value.slice(-KIOSK_USER_NUMBER_VISIBLE_DIGITS)}`;
}
