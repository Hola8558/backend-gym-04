import { AccountType } from '@prisma/client';

export type CreateAccountWithUserInput = {
  name: string;
  type: AccountType;
  email: string;
  password: string | null;
  requiresPasswordChange?: boolean;
  branch?: string;
  stripeCustomerId?: string | null;
};
