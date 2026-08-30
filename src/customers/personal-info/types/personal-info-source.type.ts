export type PersonalInfoSource = {
  email: string | null;
  userNumber: string | null;
  profile: {
    name: string | null;
    lastName: string | null;
    phone: string | null;
    emergencyPhone: string | null;
  } | null;
};
