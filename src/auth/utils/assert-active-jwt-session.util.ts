import { UnauthorizedException } from '@nestjs/common';
import { GenericStatus } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';

export async function assertActiveJwtSession(
  prisma: PrismaService,
  idUser: number,
  idAccount: number,
): Promise<void> {
  const row = await prisma.user.findFirst({
    where: { idUser, idAccount },
    select: {
      status: true,
      account: {
        select: { status: true },
      },
    },
  });

  const accountStatus = row?.account.status;
  const userIsActive = row?.status === GenericStatus.active;
  const accountAllowsSession =
    accountStatus === GenericStatus.active ||
    accountStatus === GenericStatus.pending;

  if (!userIsActive || !accountAllowsSession) {
    throw new UnauthorizedException('AUTH.ERRORS.ACCOUNT_NOT_ACTIVE');
  }
}
