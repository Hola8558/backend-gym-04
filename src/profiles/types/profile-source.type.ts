import { UserRole } from '@prisma/client';

export interface ProfileSourceRow {
  email: string | null;
  role: UserRole;
  account: {
    name: string | null;
  };
  profile: {
    name: string | null;
    lastName: string | null;
    phone: string | null;
    createdAt: Date;
  } | null;
}
