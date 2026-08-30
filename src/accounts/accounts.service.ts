import {
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
import { PrismaService } from '../core/prisma/prisma.service';
import { CUSTOMERS_LIMIT_BY_TYPE } from './constants/customers-limit-by-type.const';
import { EmailStatusValidationResponseDto } from './dto/email-status-validation-response.dto';
import { SoftDeleteAccountResponseDto } from './dto/soft-delete-account-response.dto';
import { StripeBillingService } from './stripe-billing.service';
import type { CreateAccountWithUserInput } from './types/create-account-with-user-input.type';
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
    const requiresPasswordChange = dto.requiresPasswordChange ?? false;

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
        where: { role: role },
      });

      if (features.length > 0) {
        await tx.featureFlag.createMany({
          data: features.map((f) => ({
            idUser: user.idUser,
            idFeature: f.idFeature,
            status: GenericStatus.active,
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
