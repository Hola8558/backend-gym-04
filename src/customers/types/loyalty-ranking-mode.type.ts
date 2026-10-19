export type LoyaltyRankingMode = 'memberships' | 'enrollment';

export function parseLoyaltyRankingMode(raw?: string): LoyaltyRankingMode {
  if (raw == null || raw.trim() === '' || raw === 'memberships') {
    return 'memberships';
  }
  if (raw === 'enrollment') {
    return 'enrollment';
  }
  return 'memberships';
}
