type ProfileNameSlice = { name: string | null; lastName: string | null } | null;

/** Public-screen label: first name + last-name initial ("Juan P."). */
export function buildKioskDisplayName(profile: ProfileNameSlice): string {
  const first = profile?.name?.trim() ?? '';
  const lastInitial = profile?.lastName?.trim().charAt(0) ?? '';
  return [first, lastInitial ? `${lastInitial.toUpperCase()}.` : '']
    .filter(Boolean)
    .join(' ');
}
