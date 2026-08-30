import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GenericStatus } from '@prisma/client';
import type { JwtPayload } from '../../auth/jwt.strategy';
import { PrismaService } from '../../core/prisma/prisma.service';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';

function normalizeFeatureIds(value: unknown): number[] {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && n >= 1);
  }
  const single = Number(value);
  if (Number.isInteger(single) && single >= 1) {
    return [single];
  }
  return [];
}

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('SECURITY.ERRORS.ACCESS_DENIED');
    }

    const role =
      user.role === undefined || user.role === null
        ? ''
        : String(user.role).toUpperCase();
    if (role === 'OWNER') {
      return true;
    }

    const raw = this.reflector.getAllAndOverride<unknown>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const featureIds = normalizeFeatureIds(raw);
    if (featureIds.length === 0) {
      return true;
    }

    const isCoachOrSoloCoach = role === 'COACH' || role === 'SOLO_COACH';
    if (!isCoachOrSoloCoach) {
      throw new ForbiddenException('SECURITY.ERRORS.ACCESS_DENIED');
    }

    const flag = await this.prisma.featureFlag.findFirst({
      where: {
        idUser: user.sub,
        idFeature: { in: featureIds },
        status: GenericStatus.active,
      },
      select: { idFeature: true },
    });

    if (!flag) {
      throw new ForbiddenException('SECURITY.ERRORS.FEATURE_FORBIDDEN');
    }

    return true;
  }
}
