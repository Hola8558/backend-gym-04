import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  AccountType,
  GenericStatus,
  UserRole,
} from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';

const USER_NUMBER_ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateUserNumber(): string {
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += USER_NUMBER_ALPHANUM[randomInt(USER_NUMBER_ALPHANUM.length)];
  }
  return out;
}

export type CreateAccountResponse = {
  id_account: number;
  name: string | null;
  type: AccountType;
  status: GenericStatus;
  created_at: Date;
  id_user: number;
  email: string | null;
  role: UserRole;
  branch: string | null;
  user_number: string | null;
  user_status: GenericStatus;
  user_created_at: Date;
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

    const account = await this.prisma.account.create({
      data: {
        name: dto.name,
        type: dto.type,
        status: GenericStatus.active,
        createdAt: now,
        users: {
          create: {
            branch,
            userNumber,
            email: dto.email,
            passwordHash: dto.password_hash,
            role: dto.role,
            status: GenericStatus.active,
            createdAt: now,
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

    return {
      id_account: account.idAccount,
      name: account.name,
      type: account.type,
      status: account.status,
      created_at: account.createdAt,
      id_user: user.idUser,
      email: user.email,
      role: user.role,
      branch: user.branch,
      user_number: user.userNumber,
      user_status: user.status,
      user_created_at: user.createdAt,
    };
  }
}
