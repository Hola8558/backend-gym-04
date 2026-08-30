import type { GenericStatus, UserRole } from '@prisma/client';

export type PasswordResetUser = {
  idUser: number;
  idAccount: number;
  email: string | null;
  status: GenericStatus;
  role: UserRole;
  profile: { name: string | null; lastName: string | null } | null;
  account: { name: string | null };
};
