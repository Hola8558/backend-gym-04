import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  AccountType,
  GenericStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';

const NUMBERS = '0123456789';

const CUSTOMERS_LIMIT_BY_TYPE: Record<AccountType, number> = {
  [AccountType.gym]: 120,
  [AccountType.coach]: 40,
  [AccountType.studio]: 500,
  [AccountType.enterprise]: 1000,
};

function generateUserNumber(): string {
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  }
  return out;
}

function deriveFirstUserRole(accountType: AccountType): UserRole {
  return accountType === AccountType.coach
    ? UserRole.coach
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
  constructor(private readonly prisma: PrismaService) {}

  async createAccountWithUser(
    dto: CreateAccountDto,
  ): Promise<CreateAccountResponse> {
    const branch = dto.branch ?? 'A';
    const userNumber = generateUserNumber();
    const now = new Date();
    const customersLimit = CUSTOMERS_LIMIT_BY_TYPE[dto.type];
    const role = deriveFirstUserRole(dto.type);
    const passwordHash = await bcrypt.hash(dto.password, 10);

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
}
