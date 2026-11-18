import { accountNamesMatch } from './account-names-match.util';

describe('accountNamesMatch', () => {
  it('matches the same name ignoring case and surrounding spaces', () => {
    expect(accountNamesMatch('  GymtestConsole ', 'gymtestconsole')).toBe(true);
  });

  it('rejects a different name or an empty stored name', () => {
    expect(accountNamesMatch('GymtestConsole', 'Otro')).toBe(false);
    expect(accountNamesMatch(null, 'GymtestConsole')).toBe(false);
    expect(accountNamesMatch('   ', 'GymtestConsole')).toBe(false);
  });
});
