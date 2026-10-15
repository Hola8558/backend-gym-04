import { ForbiddenException } from '@nestjs/common';
import { GenericStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { isSoloCoachAccountType } from './is-solo-coach-account-type.util';

/**
 * Confirms the signed-in user is an active owner of a gym account,
 * or an active solo coach of a solo-coach account.
 * The account type is read from the database for `idAccount`, not from the token alone.
 */
export async function assertOwnerOrSoloCoachAccount(
  prisma: PrismaService,
  idAccount: number,
  idUser: number,
  forbiddenKey: string,
): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      idUser,
      idAccount,
      status: GenericStatus.active,
    },
    select: {
      role: true,
      account: {
        select: { type: true, status: true },
      },
    },
  });

  const accountStatus = user?.account.status;
  const accountAllowsChange =
    accountStatus === GenericStatus.active ||
    accountStatus === GenericStatus.pending;
  if (!user || !accountAllowsChange) {
    throw new ForbiddenException(forbiddenKey);
  }

  const soloCoachAccount = isSoloCoachAccountType(user.account.type);
  const roleMatchesAccount =
    (user.role === UserRole.owner && !soloCoachAccount) ||
    (user.role === UserRole.solo_coach && soloCoachAccount);

  if (!roleMatchesAccount) {
    throw new ForbiddenException(forbiddenKey);
  }
}
