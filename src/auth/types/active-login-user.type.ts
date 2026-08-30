import type { Prisma } from '@prisma/client';

export const activeLoginUserInclude = {
  profile: true,
  account: true,
} satisfies Prisma.UserInclude;

export type ActiveLoginUser = Prisma.UserGetPayload<{
  include: typeof activeLoginUserInclude;
}>;
