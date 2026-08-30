import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AccountType, GenericStatus, Prisma, UserRole } from '@prisma/client';
import { isSoloCoachAccountType } from '../common/utils/is-solo-coach-account-type.util';
import { PrismaService } from '../core/prisma/prisma.service';
import { UpdateUserFeaturesDto } from './dto/update-user-features.dto';
import { UserFeatureResponseDto } from './dto/user-feature-response.dto';

@Injectable()
export class FeaturesService {
  /** Gym (and other non–solo-coach) account setup feature id. */
  private static readonly GYM_ACCOUNT_SETUP_FEATURE_ID = 5003;

  /** Solo-coach account setup feature id (parallel to 5003). */
  private static readonly SOLO_COACH_ACCOUNT_SETUP_FEATURE_ID = 5008;

  constructor(private readonly prisma: PrismaService) {}

  async getUserFeatures(userId: number): Promise<UserFeatureResponseDto[]> {
    const rows = await this.prisma.featureFlag.findMany({
      where: {
        idUser: userId,
        feature: {
          status: GenericStatus.active,
        },
      },
      include: {
        feature: true,
      },
    });

    return rows.map((row) => ({
      featureKey: String(row.idFeature),
      value: row.status === GenericStatus.active,
      customizable: row.feature.customizable,
      description: this.stringifyDescription(row.feature.description),
    }));
  }

  async updateUserFeatures(
    userId: number,
    dto: UpdateUserFeaturesDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { idUser: userId },
      select: {
        role: true,
        account: { select: { type: true } },
      },
    });

    if (!user) {
      throw new ForbiddenException('FEATURES.ERRORS.SETUP_WRITE_DENIED');
    }

    const requiredSetupFeatureId = this.resolveSetupFeatureIdForUser(user);
    await this.assertActiveUserFeature(userId, requiredSetupFeatureId);

    for (const feature of dto.features) {
      const idFeature = Number(feature.id);
      if (!Number.isInteger(idFeature) || idFeature < 1) {
        throw new BadRequestException('FEATURES.ERRORS.INVALID_FEATURE_ID');
      }
      if (idFeature === requiredSetupFeatureId && !feature.value) {
        throw new ForbiddenException('FEATURES.ERRORS.CANNOT_DISABLE_OWN_SETUP_FEATURE');
      }
    }

    const operations = dto.features.map((feature) =>
      this.prisma.featureFlag.updateMany({
        where: {
          idUser: userId,
          idFeature: Number(feature.id),
        },
        data: {
          status: feature.value
            ? GenericStatus.active
            : GenericStatus.inactive,
        },
      }),
    );

    await this.prisma.$transaction(operations);

    return { message: 'FEATURES.SAVE_SUCCESS' };
  }

  /**
   * Independent-coach accounts use feature 5008 (`AccountType.coach` and/or `UserRole.solo_coach`).
   * Gym (and other) owners use feature 5003.
   */
  private resolveSetupFeatureIdForUser(user: {
    role: UserRole;
    account: { type: AccountType } | null;
  }): number {
    const isSoloCoachAccount =
      user.role === UserRole.solo_coach ||
      (user.account != null && isSoloCoachAccountType(user.account.type));

    if (isSoloCoachAccount) {
      return FeaturesService.SOLO_COACH_ACCOUNT_SETUP_FEATURE_ID;
    }

    if (user.role === UserRole.owner) {
      return FeaturesService.GYM_ACCOUNT_SETUP_FEATURE_ID;
    }

    throw new ForbiddenException('FEATURES.ERRORS.SETUP_WRITE_DENIED');
  }

  private async assertActiveUserFeature(
    userId: number,
    idFeature: number,
  ): Promise<void> {
    const row = await this.prisma.featureFlag.findFirst({
      where: {
        idUser: userId,
        idFeature,
        status: GenericStatus.active,
        feature: { status: GenericStatus.active },
      },
    });
    if (!row) {
      throw new ForbiddenException('FEATURES.ERRORS.SETUP_WRITE_DENIED');
    }
  }

  private stringifyDescription(
    description: Prisma.JsonValue | null,
  ): string | undefined {
    if (description === null || description === undefined) {
      return undefined;
    }
    if (typeof description === 'string') {
      return description;
    }
    return JSON.stringify(description);
  }
}
