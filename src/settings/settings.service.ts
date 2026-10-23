import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, Prisma } from '@prisma/client';
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
import { normalizeMandatoryCustomerFields } from '../common/constants/customer-form-field-ids.const';
import { MandatoryFieldsResponseDto } from './dto/mandatory-fields-response.dto';
import { UpdateMandatoryFieldsDto } from './dto/update-mandatory-fields.dto';
import { toMandatoryFieldsResponseDto } from './utils/mandatory-fields-response.mapper';
import { assertMandatoryFieldsManager } from './utils/assert-mandatory-fields-manager.util';
import { HealthPreferencesResponseDto } from './dto/health-preferences-response.dto';
import { UpdateHealthPreferencesDto } from './dto/update-health-preferences.dto';
import { toHealthPreferencesResponseDto } from './utils/health-preferences-response.mapper';
import {
  HEALTH_PREFERENCE_DELETED_SUFFIX,
  healthPreferenceBaseName,
  healthPreferenceNameKey,
  isDeletedHealthPreference,
  joinHealthPreferences,
  normalizeHealthPreferenceName,
  splitHealthPreferences,
} from './utils/health-preference-lists.util';

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

  async getMandatoryFields(
    idAccount: number,
  ): Promise<MandatoryFieldsResponseDto> {
    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount },
      select: { mandatoryFields: true },
    });
    if (!detail) {
      throw new NotFoundException('SETTINGS.ERRORS.ACCOUNT_NOT_FOUND');
    }
    return toMandatoryFieldsResponseDto(detail.mandatoryFields);
  }

  async updateMandatoryFields(
    idAccount: number,
    idUser: number,
    dto: UpdateMandatoryFieldsDto,
  ): Promise<MandatoryFieldsResponseDto> {
    await assertMandatoryFieldsManager(this.prisma, idAccount, idUser);

    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount },
      select: { idAccountDetail: true },
    });
    if (!detail) {
      throw new NotFoundException('SETTINGS.ERRORS.ACCOUNT_NOT_FOUND');
    }

    const mandatoryFields = normalizeMandatoryCustomerFields(dto.mandatory_fields);
    const updated = await this.prisma.accountDetail.update({
      where: { idAccountDetail: detail.idAccountDetail },
      data: { mandatoryFields },
      select: { mandatoryFields: true },
    });
    return toMandatoryFieldsResponseDto(updated.mandatoryFields);
  }

  async getHealthPreferences(
    idAccount: number,
  ): Promise<HealthPreferencesResponseDto> {
    const preferences = await this.loadHealthPreferences(idAccount);
    return toHealthPreferencesResponseDto(preferences);
  }

  async updateHealthPreferences(
    idAccount: number,
    idUser: number,
    dto: UpdateHealthPreferencesDto,
  ): Promise<HealthPreferencesResponseDto> {
    await assertMandatoryFieldsManager(this.prisma, idAccount, idUser);
    const current = await this.loadHealthPreferences(idAccount);
    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount },
      select: { idAccountDetail: true },
    });
    if (!detail) {
      throw new NotFoundException('SETTINGS.ERRORS.ACCOUNT_NOT_FOUND');
    }
    const planned = this.planHealthPreferenceAction(current, dto);
    await this.prisma.$transaction(async (tx) => {
      if (planned.rename) {
        await this.renameHealthPreferenceKey(
          tx,
          idAccount,
          planned.rename.from,
          planned.rename.to,
        );
      }
      await tx.accountDetail.update({
        where: { idAccountDetail: detail.idAccountDetail },
        data: { preferences: planned.next },
      });
    });
    return toHealthPreferencesResponseDto(planned.next);
  }

  private async loadHealthPreferences(idAccount: number): Promise<string[]> {
    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount },
      select: { preferences: true },
    });
    if (!detail) {
      throw new NotFoundException('SETTINGS.ERRORS.ACCOUNT_NOT_FOUND');
    }
    return detail.preferences;
  }

  private planHealthPreferenceAction(
    current: string[],
    dto: UpdateHealthPreferencesDto,
  ): { next: string[]; rename?: { from: string; to: string } } {
    const { active, deleted } = splitHealthPreferences(current);
    if (dto.action === 'add') {
      const name = this.requirePreferenceName(dto.name);
      this.assertPreferenceNameFree(current, name);
      return { next: joinHealthPreferences([...active, name], deleted) };
    }
    if (dto.action === 'rename') {
      const from = dto.name.trim();
      const to = this.requirePreferenceName(dto.next_name ?? '');
      if (!active.includes(from)) {
        throw new BadRequestException('SETTINGS.ERRORS.PREFERENCE_NOT_FOUND');
      }
      this.assertPreferenceNameFree(current, to, from);
      return {
        next: joinHealthPreferences(
          active.map((name) => (name === from ? to : name)),
          deleted,
        ),
        rename: { from, to },
      };
    }
    if (dto.action === 'delete') {
      const name = dto.name.trim();
      if (!active.includes(name)) {
        throw new BadRequestException('SETTINGS.ERRORS.PREFERENCE_NOT_FOUND');
      }
      const deletedName = `${name}${HEALTH_PREFERENCE_DELETED_SUFFIX}`;
      if (deleted.includes(deletedName)) {
        throw new BadRequestException('SETTINGS.ERRORS.PREFERENCE_NAME_TAKEN');
      }
      return {
        next: joinHealthPreferences(
          active.filter((item) => item !== name),
          [...deleted, deletedName],
        ),
      };
    }
    const stored = dto.name.trim();
    if (!deleted.includes(stored) || !isDeletedHealthPreference(stored)) {
      throw new BadRequestException('SETTINGS.ERRORS.PREFERENCE_NOT_FOUND');
    }
    const restored = healthPreferenceBaseName(stored);
    this.assertPreferenceNameFree(current, restored, stored);
    return {
      next: joinHealthPreferences(
        [...active, restored],
        deleted.filter((item) => item !== stored),
      ),
    };
  }

  private requirePreferenceName(raw: string): string {
    const name = normalizeHealthPreferenceName(raw);
    if (!name) {
      const trimmed = raw.trim();
      if (!trimmed) {
        throw new BadRequestException('SETTINGS.ERRORS.PREFERENCE_NAME_REQUIRED');
      }
      if (trimmed.toLocaleLowerCase().endsWith(HEALTH_PREFERENCE_DELETED_SUFFIX)) {
        throw new BadRequestException('SETTINGS.ERRORS.PREFERENCE_NAME_RESERVED');
      }
      throw new BadRequestException('SETTINGS.ERRORS.PREFERENCE_NAME_TOO_LONG');
    }
    return name;
  }

  private assertPreferenceNameFree(
    current: readonly string[],
    name: string,
    except?: string,
  ): void {
    const key = healthPreferenceNameKey(name);
    const taken = current.some(
      (item) => item !== except && healthPreferenceNameKey(item) === key,
    );
    if (taken) {
      throw new BadRequestException('SETTINGS.ERRORS.PREFERENCE_NAME_TAKEN');
    }
  }

  /** One account-scoped JSON key rename. Not a full-table rewrite. */
  private async renameHealthPreferenceKey(
    tx: Prisma.TransactionClient,
    idAccount: number,
    from: string,
    to: string,
  ): Promise<void> {
    await tx.$executeRaw`
      UPDATE profiles AS p
      SET health_and_preferences =
        (p.health_and_preferences - ${from})
        || jsonb_build_object(
          ${to},
          COALESCE(p.health_and_preferences -> ${from}, '[]'::jsonb)
        )
      FROM users AS u
      WHERE p.id_user = u.id_user
        AND u.id_account = ${idAccount}
        AND p.health_and_preferences IS NOT NULL
        AND jsonb_exists(p.health_and_preferences, ${from})
    `;
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
