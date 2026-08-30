import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { GenericStatus } from '@prisma/client';
import type { PrismaService } from '../../core/prisma/prisma.service';
import {
  activeLoginUserInclude,
  type ActiveLoginUser,
} from '../types/active-login-user.type';

type LoginQueryClient = Pick<PrismaService, 'user'>;

export async function findActiveLoginUser(
  prisma: LoginQueryClient,
  identifier: string,
): Promise<ActiveLoginUser> {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return findActiveUserByEmail(prisma, trimmed);
  }
  return findActiveUserByNumber(prisma, trimmed);
}

async function findActiveUserByNumber(
  prisma: LoginQueryClient,
  identifier: string,
): Promise<ActiveLoginUser> {
  const user = await prisma.user.findFirst({
    where: {
      userNumber: identifier,
      status: GenericStatus.active,
    },
    include: activeLoginUserInclude,
  });

  if (!user) {
    throw new UnauthorizedException('AUTH.ERRORS.INVALID_CREDENTIALS');
  }

  return user;
}

async function findActiveUserByEmail(
  prisma: LoginQueryClient,
  identifier: string,
): Promise<ActiveLoginUser> {
  const users = await prisma.user.findMany({
    where: {
      email: {
        equals: identifier,
        mode: 'insensitive',
      },
      status: GenericStatus.active,
    },
    include: activeLoginUserInclude,
  });

  if (users.length === 0) {
    throw new UnauthorizedException('AUTH.ERRORS.INVALID_CREDENTIALS');
  }

  if (users.length > 1) {
    throw new ConflictException('AUTH.ERRORS.MULTIPLE_ACTIVE_ACCOUNTS');
  }

  return users[0];
}

export function assertAccountAllowsLogin(accountStatus: GenericStatus): void {
  if (
    accountStatus !== GenericStatus.active &&
    accountStatus !== GenericStatus.pending
  ) {
    throw new ForbiddenException('AUTH.ERRORS.ACCOUNT_INVALID');
  }
}
