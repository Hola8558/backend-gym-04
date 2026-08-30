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
import {
  REQUIRE_ACCESS_KEY,
  type AccessRequirements,
} from '../decorators/require-access.decorator';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirements = this.reflector.getAllAndOverride<AccessRequirements>(
      REQUIRE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirements) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('SECURITY.ERRORS.ACCESS_DENIED');
    }

    const roleList = requirements.roles?.filter(Boolean) ?? [];
    if (roleList.length > 0 && roleList.includes(user.role as string)) {
      return true;
    }

    const featureIds = (requirements.features ?? [])
      .map((id) => Number(id))
      .filter((n) => Number.isInteger(n) && n >= 1);

    if (featureIds.length > 0) {
      const feature = await this.prisma.featureFlag.findFirst({
        where: {
          idUser: user.sub,
          idFeature: { in: featureIds },
          status: GenericStatus.active,
        },
      });
      if (feature) {
        return true;
      }
    }

    throw new ForbiddenException('SECURITY.ERRORS.ACCESS_DENIED');
  }
}
