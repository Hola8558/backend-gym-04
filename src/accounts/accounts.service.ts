import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountType,
  GenericStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { isSoloCoachAccountType } from '../common/utils/is-solo-coach-account-type.util';
import { resolveInitialFeatureFlagStatus } from '../common/utils/resolve-initial-feature-flag-status.util';
import { PrismaService } from '../core/prisma/prisma.service';
import { DEFAULT_GLOBAL_MEASUREMENTS } from './constants/default-global-measurements.const';
import { CUSTOMERS_LIMIT_BY_TYPE } from './constants/customers-limit-by-type.const';
import { resolveUnitSystem } from './utils/resolve-unit-system.util';
import { DEFAULT_MANDATORY_CUSTOMER_FIELDS } from '../common/constants/customer-form-field-ids.const';
import { DeprovisionAccountDto } from './dto/deprovision-account.dto';
import { EmailStatusValidationResponseDto } from './dto/email-status-validation-response.dto';
import { ProvisionAccountDto } from './dto/provision-account.dto';
import { SoftDeleteAccountResponseDto } from './dto/soft-delete-account-response.dto';
import { StripeBillingService } from './stripe-billing.service';
import type { BusinessAccountIdentity } from './types/business-account-identity.type';
import type { BusinessAccountStripeLink } from './types/business-account-stripe-link.type';
import type { CreateAccountWithUserInput } from './types/create-account-with-user-input.type';
import type { LinkStripeBillingInput } from './types/link-stripe-billing-input.type';
import type { StripeBillingLinkResult } from './types/stripe-billing-link-result.type';
import { accountNamesMatch } from './utils/account-names-match.util';
import { mapAccountStatusToEmailValidationStatus } from './utils/map-account-status-to-email-validation-status.util';
import { softDeleteAccountCascade } from './utils/soft-delete-account-cascade.util';
import { toEmailStatusValidationResponseDto } from './utils/to-email-status-validation-response.mapper';
import { toSoftDeleteAccountResponseDto } from './utils/to-soft-delete-account-response.mapper';

const NUMBERS = '0123456789';

function generateUserNumber(): string {
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  }
  return out;
}

function deriveFirstUserRole(accountType: AccountType): UserRole {
  return isSoloCoachAccountType(accountType)
    ? UserRole.solo_coach
    : UserRole.owner;
}

function hiddenEmail(email: string | null): string | null {
  if (email == null || email === '') {
    return email;
  }
  const at = email.indexOf('@');
  if (at <= 0) {
    return email;
  }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (domain === '') {
    return email;
  }
  const first2 = local.slice(0, 2);
  const lastBeforeAt = local.slice(-1);
  return `${first2}*******${lastBeforeAt}@${domain}`;
}

export type CreateAccountResponse = {
  name: string | null;
  type: AccountType;
  email: string | null;

};

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeBillingService: StripeBillingService,
  ) {}

  async createAccountWithUser(
    dto: CreateAccountWithUserInput,
  ): Promise<CreateAccountResponse> {
    const branch = dto.branch ?? 'A';
    const userNumber = generateUserNumber();
    const now = new Date();
    const customersLimit = CUSTOMERS_LIMIT_BY_TYPE[dto.type];
    const role = deriveFirstUserRole(dto.type);
    const passwordHash =
      dto.password == null || dto.password === ''
        ? null
        : await bcrypt.hash(dto.password, 10);
    const requiresPasswordChange = dto.requiresPasswordChange ?? true;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const account = await tx.account.create({
        data: {
          name: dto.name,
          type: dto.type,
          status: GenericStatus.active,
          createdAt: now,
          accountDetail: {
            create: {
              customersLimit,
              mandatoryFields: [...DEFAULT_MANDATORY_CUSTOMER_FIELDS],
              preferences: ['alergias', 'lesiones'],
              globalMeasurements: [
                ...DEFAULT_GLOBAL_MEASUREMENTS,
              ] as unknown as Prisma.InputJsonValue,
              unitSystem: resolveUnitSystem(null),
              ...(dto.stripeCustomerId
                ? { stripeCustomerId: dto.stripeCustomerId }
                : {}),
            },
          },
          users: {
            create: {
              branch,
              userNumber,
              email: dto.email,
              passwordHash,
              role,
              status: GenericStatus.active,
              requiresPasswordChange,
              profile: {
                create: {
                  name: dto.name,
                  status: GenericStatus.active,
                  createdAt: now,
                },
              },
            },
          },
        },
        include: {
          users: true,
        },
      });

      const user = account.users[0];
      if (!user) {
        throw new InternalServerErrorException(
          'Account was created without an initial user',
        );
      }

      const features = await tx.feature.findMany({
        where: {
          role,
          status: GenericStatus.active,
        },
        select: {
          idFeature: true,
          customizable: true,
        },
      });

      if (features.length > 0) {
        await tx.featureFlag.createMany({
          data: features.map((f) => ({
            idUser: user.idUser,
            idFeature: f.idFeature,
            status: resolveInitialFeatureFlagStatus(f.customizable),
          })),
        });
      }

      return {
        name: account.name,
        type: account.type,
        email: hiddenEmail(user.email),
      };
    });
  }

  async provisionAccountWithoutStripe(
    dto: ProvisionAccountDto,
  ): Promise<CreateAccountResponse> {
    const email = dto.email.trim();
    const existing = await this.findBusinessAccountsForStripeLink(email);
    if (existing.length > 0) {
      throw new ConflictException('ACCOUNTS.ERRORS.EMAIL_ALREADY_EXISTS');
    }

    return this.createAccountWithUser({
      name: dto.name.trim(),
      type: dto.type,
      email,
      password: null,
      branch: dto.branch,
      requiresPasswordChange: true,
    });
  }

  async deprovisionAccount(
    dto: DeprovisionAccountDto,
  ): Promise<SoftDeleteAccountResponseDto> {
    const matches = await this.findNonDeletedBusinessAccountsByEmail(dto.email);
    if (matches.length === 0) {
      throw new NotFoundException('ACCOUNTS.ERRORS.NOT_FOUND');
    }
    if (matches.length > 1) {
      throw new ConflictException('ACCOUNTS.ERRORS.AMBIGUOUS_EMAIL');
    }

    const match = matches[0];
    if (!accountNamesMatch(match.name, dto.name)) {
      throw new BadRequestException('ACCOUNTS.ERRORS.NAME_MISMATCH');
    }

    return this.softDeleteAccountById(match.idAccount);
  }

  async findNonDeletedBusinessAccountsByEmail(
    email: string,
  ): Promise<BusinessAccountIdentity[]> {
    const users = await this.prisma.user.findMany({
      where: {
        email: { equals: email.trim(), mode: 'insensitive' },
        status: { not: GenericStatus.deleted },
        role: { in: [UserRole.owner, UserRole.solo_coach] },
        account: {
          status: { not: GenericStatus.deleted },
        },
      },
      select: {
        idAccount: true,
        account: { select: { name: true } },
      },
    });

    const byAccount = new Map<number, BusinessAccountIdentity>();
    for (const user of users) {
      if (byAccount.has(user.idAccount)) {
        continue;
      }
      byAccount.set(user.idAccount, {
        idAccount: user.idAccount,
        name: user.account.name,
      });
    }
    return [...byAccount.values()];
  }

  async findBusinessAccountsForStripeLink(
    email: string,
  ): Promise<BusinessAccountStripeLink[]> {
    const users = await this.prisma.user.findMany({
      where: {
        email: { equals: email.trim(), mode: 'insensitive' },
        status: { not: GenericStatus.deleted },
        role: { in: [UserRole.owner, UserRole.solo_coach] },
        account: {
          status: {
            notIn: [GenericStatus.deleted, GenericStatus.banned],
          },
        },
      },
      select: {
        idAccount: true,
        account: {
          select: {
            accountDetail: {
              select: { stripeCustomerId: true },
            },
          },
        },
      },
    });

    const byAccount = new Map<number, BusinessAccountStripeLink>();
    for (const user of users) {
      if (byAccount.has(user.idAccount)) {
        continue;
      }
      byAccount.set(user.idAccount, {
        idAccount: user.idAccount,
        stripeCustomerId: user.account.accountDetail?.stripeCustomerId ?? null,
      });
    }
    return [...byAccount.values()];
  }

  async linkStripeBillingToAccount(
    input: LinkStripeBillingInput,
  ): Promise<StripeBillingLinkResult> {
    const account = await this.prisma.account.findUnique({
      where: { idAccount: input.idAccount },
      select: {
        status: true,
        accountDetail: { select: { stripeCustomerId: true } },
      },
    });
    if (
      !account ||
      account.status === GenericStatus.deleted ||
      account.status === GenericStatus.banned
    ) {
      return 'unavailable';
    }
    if (!account.accountDetail) {
      return 'missing_detail';
    }

    const stored = account.accountDetail.stripeCustomerId;
    const current = stored?.trim() ?? '';
    if (current.length > 0 && current !== input.stripeCustomerId) {
      return 'conflict';
    }

    let result: StripeBillingLinkResult = 'linked';
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const written = await tx.accountDetail.updateMany({
        where: {
          idAccount: input.idAccount,
          stripeCustomerId: stored,
        },
        data: {
          stripeCustomerId: input.stripeCustomerId,
          ...(input.type
            ? { customersLimit: CUSTOMERS_LIMIT_BY_TYPE[input.type] }
            : {}),
        },
      });

      const detailNow = await tx.accountDetail.findUnique({
        where: { idAccount: input.idAccount },
        select: { stripeCustomerId: true },
      });
      const linkedId = detailNow?.stripeCustomerId?.trim() ?? '';
      if (written.count === 0 && linkedId !== input.stripeCustomerId) {
        result = 'conflict';
        return;
      }
      if (linkedId !== input.stripeCustomerId) {
        result = 'conflict';
        return;
      }

      await tx.account.update({
        where: { idAccount: input.idAccount },
        data: {
          ...(input.status ? { status: input.status } : {}),
          ...(input.type ? { type: input.type } : {}),
        },
      });
    });

    return result;
  }

  async findIdAccountsByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<number[]> {
    const details = await this.prisma.accountDetail.findMany({
      where: { stripeCustomerId },
      select: { idAccount: true },
    });
    return details.map((detail) => detail.idAccount);
  }

  async setStatusByStripeCustomerId(
    stripeCustomerId: string,
    status: GenericStatus,
  ): Promise<number> {
    const idAccounts =
      await this.findIdAccountsByStripeCustomerId(stripeCustomerId);
    if (idAccounts.length === 0) {
      return 0;
    }

    const result = await this.prisma.account.updateMany({
      where: { idAccount: { in: idAccounts } },
      data: { status },
    });
    return result.count;
  }

  async softDeleteAccountsByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<number> {
    const idAccounts =
      await this.findIdAccountsByStripeCustomerId(stripeCustomerId);
    if (idAccounts.length === 0) {
      return 0;
    }

    let softDeleted = 0;
    for (const idAccount of idAccounts) {
      const result = await this.softDeleteAccountById(idAccount);
      if (!result.already_deleted) {
        softDeleted += 1;
      }
    }
    return softDeleted;
  }

  async softDeleteAccountById(
    idAccount: number,
  ): Promise<SoftDeleteAccountResponseDto> {
    const account = await this.prisma.account.findUnique({
      where: { idAccount },
      select: { idAccount: true, status: true },
    });
    if (!account) {
      throw new NotFoundException('ACCOUNTS.ERRORS.NOT_FOUND');
    }
    if (account.status === GenericStatus.deleted) {
      return toSoftDeleteAccountResponseDto({
        id_account: idAccount,
        already_deleted: true,
      });
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await softDeleteAccountCascade(tx, idAccount);
    });

    return toSoftDeleteAccountResponseDto({
      id_account: idAccount,
      already_deleted: false,
    });
  }

  async validateEmailStatus(
    email: string,
  ): Promise<EmailStatusValidationResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        status: { not: GenericStatus.deleted },
      },
      select: {
        idAccount: true,
        account: { select: { status: true } },
      },
    });

    if (!user) {
      return toEmailStatusValidationResponseDto('not_found');
    }

    const status = mapAccountStatusToEmailValidationStatus(user.account.status);
    const stripeLink =
      await this.stripeBillingService.createBillingPortalUrlOrNull(
        user.idAccount,
      );
    return toEmailStatusValidationResponseDto(
      status,
      stripeLink ?? undefined,
    );
  }
}
