import { Injectable, Logger } from '@nestjs/common';
import { GenericStatus, UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PrismaService } from '../core/prisma/prisma.service';
import { ACCESS_FEATURE_CHECKIN_ID } from './constants/access-feature.constants';
import { FeatureCheckinResponseDto } from './dto/feature-checkin-response.dto';

@Injectable()
export class AccessService {
  private readonly logger = new Logger('CheckinFeature');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Whether the gym account tied to `userNumber` has active check-in (feature 5001)
   * on its owner or solo coach.
   */
  async isCheckinFeatureEnabled(userNumber: string): Promise<boolean> {
    const normalizedUserNumber = userNumber.trim();

    this.logger.debug(
      `1. Incoming userNumber string: "${userNumber}" | Normalized: "${normalizedUserNumber}"`,
    );

    if (!normalizedUserNumber.length) {
      return false;
    }

    const client = await this.prisma.user.findUnique({
      where: { userNumber: normalizedUserNumber },
      select: { idAccount: true },
    });

    this.logger.debug(`2. Client lookup result: ${JSON.stringify(client)}`);

    if (!client?.idAccount) {
      return false;
    }

    const rawFlags = await this.prisma.featureFlag.findMany({
      where: {
        idFeature: ACCESS_FEATURE_CHECKIN_ID,
        user: { idAccount: client.idAccount },
      },
      include: {
        user: { select: { role: true, status: true } },
        feature: { select: { status: true } },
      },
    });
    this.logger.warn(
      `3. RAW FLAGS FOUND FOR ACCOUNT ${client.idAccount}: ${JSON.stringify(rawFlags)}`,
    );

    const flag = await this.prisma.featureFlag.findFirst({
      where: {
        idFeature: ACCESS_FEATURE_CHECKIN_ID,
        status: GenericStatus.active,
        feature: { status: GenericStatus.active },
        user: {
          idAccount: client.idAccount,
          role: { in: [UserRole.owner, UserRole.solo_coach] },
          status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
        },
      },
      select: { idUser: true },
    });

    this.logger.debug(`4. Final strict query result: ${JSON.stringify(flag)}`);

    return flag != null;
  }

  async resolveCustomerUserNumber(user: JwtPayload): Promise<string> {
    const customer = await this.prisma.user.findFirst({
      where: {
        idUser: user.sub,
        idAccount: user.id_account,
        role: UserRole.customer,
        status: GenericStatus.active,
      },
      select: { userNumber: true },
    });

    return customer?.userNumber?.trim() ?? '';
  }

  async getCheckinFeatureStatus(
    user: JwtPayload,
  ): Promise<FeatureCheckinResponseDto> {
    const userNumber = await this.resolveCustomerUserNumber(user);
    const isEnabled =
      userNumber.length > 0
        ? await this.isCheckinFeatureEnabled(userNumber)
        : false;

    return plainToInstance(
      FeatureCheckinResponseDto,
      { success: true, isEnabled },
      { excludeExtraneousValues: true },
    );
  }
}
