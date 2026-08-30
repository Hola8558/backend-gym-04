import { randomInt } from 'crypto';

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '!@#$%&*';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

/**
 * Generates a 10-character temporary password that satisfies assertStrongPassword
 * (uppercase + digit + special, length >= 8).
 */
export function generateTempPassword(): string {
  const required = [
    UPPER[randomInt(UPPER.length)],
    LOWER[randomInt(LOWER.length)],
    DIGITS[randomInt(DIGITS.length)],
    SPECIAL[randomInt(SPECIAL.length)],
  ];

  const rest = Array.from({ length: 6 }, () => ALL[randomInt(ALL.length)]);
  const chars = [...required, ...rest];

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
