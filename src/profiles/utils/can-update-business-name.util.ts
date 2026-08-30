export function canUpdateBusinessName(role: string): boolean {
  return role === 'owner' || role === 'solo_coach';
}
