import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { UpdateAppearanceDto } from './dto/update-appearance.dto';
import { AppearanceResponseDto } from './dto/appearance-response.dto';
import {
  toAppearanceResponseDto,
  type AppearanceRecord,
} from './utils/appearance-response.mapper';
import { toStyleResponseDto, type StyleRecord } from './utils/style-response.mapper';
import { StyleResponseDto } from './dto/style-response.dto';
import { GetStyleQueryDto } from './dto/get-style-query.dto';
import { generateChangeKey } from './utils/generate-change-key.util';
import { buildConditionalStyleRecord } from './utils/build-conditional-style-response.util';

const ENTRY_LOGS_FEATURE_ID = 5001;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAppearance(idAccount: number): Promise<AppearanceResponseDto> {
    const account = await this.prisma.account.findFirst({
      where: {
        idAccount,
        status: { not: 'deleted' },
      },
      select: {
        name: true,
        accountDetail: {
          select: {
            primaryColor: true,
            logo: true,
            favicon: true,
            logoKeyChange: true,
            colorKeyChange: true,
            nameKeyChange: true,
            maxCapacity: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('SETTINGS.ERRORS.ACCOUNT_NOT_FOUND');
    }

    const canViewMaxCapacity = await this.hasActiveAccountFeature(
      idAccount,
      ENTRY_LOGS_FEATURE_ID,
    );

    return this.toResponse({
      primaryColor: account.accountDetail?.primaryColor ?? null,
      logo: account.accountDetail?.logo ?? null,
      favicon: account.accountDetail?.favicon ?? null,
      gymName: account.name,
      maxCapacity: canViewMaxCapacity
        ? (account.accountDetail?.maxCapacity ?? null)
        : null,
      logoKeyChange: account.accountDetail?.logoKeyChange ?? null,
      colorKeyChange: account.accountDetail?.colorKeyChange ?? null,
      nameKeyChange: account.accountDetail?.nameKeyChange ?? null,
    });
  }

  async getStyle(
    idAccount: number,
    query: GetStyleQueryDto,
  ): Promise<StyleResponseDto> {
    const account = await this.prisma.account.findFirst({
      where: {
        idAccount,
        status: { not: 'deleted' },
      },
      select: {
        name: true,
        accountDetail: {
          select: {
            primaryColor: true,
            logo: true,
            logoKeyChange: true,
            colorKeyChange: true,
            nameKeyChange: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('SETTINGS.ERRORS.ACCOUNT_NOT_FOUND');
    }

    const conditionalRecord = buildConditionalStyleRecord(
      {
        logo: account.accountDetail?.logo ?? null,
        primaryColor: account.accountDetail?.primaryColor ?? null,
        gymName: account.name,
        logoKeyChange: account.accountDetail?.logoKeyChange ?? null,
        colorKeyChange: account.accountDetail?.colorKeyChange ?? null,
        nameKeyChange: account.accountDetail?.nameKeyChange ?? null,
      },
      {
        logoKey: query.logoKey,
        colorKey: query.colorKey,
        nameKey: query.nameKey,
      },
    );

    return this.toStyleResponse(conditionalRecord);
  }

  async updateAppearance(
    idAccount: number,
    dto: UpdateAppearanceDto,
  ): Promise<AppearanceResponseDto> {
    const account = await this.prisma.account.findFirst({
      where: {
        idAccount,
        status: { not: 'deleted' },
      },
      select: {
        idAccount: true,
        accountDetail: {
          select: { idAccountDetail: true },
        },
      },
    });

    if (!account?.accountDetail) {
      throw new NotFoundException('SETTINGS.ERRORS.ACCOUNT_NOT_FOUND');
    }

    const hasMaxCapacityFeature = await this.hasActiveAccountFeature(
      idAccount,
      ENTRY_LOGS_FEATURE_ID,
    );

    if (dto.maxCapacity !== undefined && !hasMaxCapacityFeature) {
      throw new ForbiddenException('SETTINGS.ERRORS.MAX_CAPACITY_FORBIDDEN');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const detailData: {
        primaryColor?: string;
        logo?: string | null;
        favicon?: string | null;
        logoKeyChange?: string;
        colorKeyChange?: string;
        nameKeyChange?: string;
        maxCapacity?: number;
      } = {};

      if (dto.color !== null) {
        detailData.primaryColor = dto.color;
        detailData.colorKeyChange = generateChangeKey();
      }

      if (dto.logo !== null) {
        detailData.logo = dto.logo;
        detailData.logoKeyChange = generateChangeKey();
      }

      if (dto.favicon !== null) {
        detailData.favicon = dto.favicon;
      }

      if (dto.name !== null) {
        detailData.nameKeyChange = generateChangeKey();
      }

      if (dto.maxCapacity !== undefined) {
        detailData.maxCapacity = dto.maxCapacity;
      }

      const accountDetail =
        Object.keys(detailData).length > 0
          ? await tx.accountDetail.update({
              where: { idAccountDetail: account.accountDetail.idAccountDetail },
              data: detailData,
              select: {
                primaryColor: true,
                logo: true,
                favicon: true,
                logoKeyChange: true,
                colorKeyChange: true,
                nameKeyChange: true,
                maxCapacity: true,
              },
            })
          : await tx.accountDetail.findUniqueOrThrow({
              where: { idAccountDetail: account.accountDetail.idAccountDetail },
              select: {
                primaryColor: true,
                logo: true,
                favicon: true,
                logoKeyChange: true,
                colorKeyChange: true,
                nameKeyChange: true,
                maxCapacity: true,
              },
            });

      const accountRow =
        dto.name !== null
          ? await tx.account.update({
              where: { idAccount },
              data: { name: dto.name },
              select: { name: true },
            })
          : await tx.account.findUniqueOrThrow({
              where: { idAccount },
              select: { name: true },
            });

      return {
        primaryColor: accountDetail.primaryColor,
        logo: accountDetail.logo,
        favicon: accountDetail.favicon,
        gymName: accountRow.name,
        maxCapacity: hasMaxCapacityFeature ? accountDetail.maxCapacity : null,
        logoKeyChange: accountDetail.logoKeyChange,
        colorKeyChange: accountDetail.colorKeyChange,
        nameKeyChange: accountDetail.nameKeyChange,
      } satisfies AppearanceRecord;
    });

    return this.toResponse(updated);
  }

  private toResponse(record: AppearanceRecord): AppearanceResponseDto {
    return toAppearanceResponseDto(record);
  }

  private toStyleResponse(record: StyleRecord): StyleResponseDto {
    return toStyleResponseDto(record);
  }

  private async hasActiveAccountFeature(
    idAccount: number,
    idFeature: number,
  ): Promise<boolean> {
    const featureFlag = await this.prisma.featureFlag.findFirst({
      where: {
        idFeature,
        status: GenericStatus.active,
        feature: { status: GenericStatus.active },
        user: {
          idAccount,
          status: GenericStatus.active,
        },
      },
      select: { idFeature: true },
    });

    return featureFlag !== null;
  }
}
