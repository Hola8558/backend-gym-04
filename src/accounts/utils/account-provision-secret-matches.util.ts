import { timingSafeEqual } from 'node:crypto';
import { ACCOUNT_PROVISION_SECRET_MIN_LENGTH } from '../constants/account-provision.constants';

export function accountProvisionSecretMatches(
  configured: string | undefined,
  provided: string | undefined,
): boolean {
  const expected = configured?.trim() ?? '';
  if (expected.length < ACCOUNT_PROVISION_SECRET_MIN_LENGTH) {
    return false;
  }

  const actual = provided ?? '';
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) {
    timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
