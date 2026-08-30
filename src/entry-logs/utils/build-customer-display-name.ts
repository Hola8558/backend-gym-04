type ProfileSlice = { name: string | null; lastName: string | null } | null;

type UserSlice = {
  userNumber: string | null;
  profile: ProfileSlice;
};

/**
 * Builds a kiosk-safe display label from profile name(s), falling back to user number.
 */
export function buildCustomerDisplayName(user: UserSlice): string {
  const first = user.profile?.name?.trim() ?? '';
  const last = user.profile?.lastName?.trim() ?? '';
  const fromProfile = [first, last].filter(Boolean).join(' ').trim();
  if (fromProfile.length > 0) {
    return fromProfile;
  }
  return (user.userNumber ?? '').trim();
}
