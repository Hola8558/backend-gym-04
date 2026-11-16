import { accountProvisionSecretMatches } from './account-provision-secret-matches.util';

const SECRET = 'a'.repeat(32);

describe('accountProvisionSecretMatches', () => {
  it('accepts the same secret', () => {
    expect(accountProvisionSecretMatches(SECRET, SECRET)).toBe(true);
  });

  it('rejects a missing, short, or different secret', () => {
    expect(accountProvisionSecretMatches(undefined, SECRET)).toBe(false);
    expect(accountProvisionSecretMatches('short-secret', 'short-secret')).toBe(
      false,
    );
    expect(accountProvisionSecretMatches(SECRET, `${SECRET}x`)).toBe(false);
    expect(accountProvisionSecretMatches(SECRET, 'b'.repeat(32))).toBe(false);
    expect(accountProvisionSecretMatches(SECRET, undefined)).toBe(false);
  });
});
