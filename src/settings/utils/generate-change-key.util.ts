import { randomBytes } from 'node:crypto';

const ALPHANUMERIC =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateChangeKey(): string {
  const bytes = randomBytes(10);
  return Array.from(bytes, (byte) => ALPHANUMERIC[byte % ALPHANUMERIC.length]).join(
    '',
  );
}
