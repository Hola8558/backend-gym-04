import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const NUMBERS = '0123456789';

function generateUserNumber(): string {
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  }
  return out;
}

export type CreateUserResponse = {
  id_user: number;
  id_account: number;
  branch: string | null;
  user_number: string | null;
  email: string | null;
  role: UserRole;
  status: GenericStatus;
  created_at: Date;
  name: string | null;
  last_name: string | null;
  phone: string | null;
  emergency_phone: string | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkAccountCapacity(
    id_account: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const detail = await tx.accountDetail.findUnique({
      where: { idAccount: id_account },
    });

    if (!detail) {
      throw new NotFoundException(
        'Account details not found; cannot verify capacity.',
      );
    }

    const userCount = await tx.user.count({
      where: { idAccount: id_account },
    });

    if (userCount >= detail.customersLimit) {
      throw new ForbiddenException(
        'Account has reached its maximum customer limit. Please upgrade your plan.',
      );
    }
  }

  async createUserWithProfile(
    dto: CreateUserDto,
    id_account: number,
  ): Promise<CreateUserResponse> {
    const branch = dto.branch ?? 'A';
    const userNumber = generateUserNumber();
    const now = new Date();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const row = await this.prisma.$transaction(async (tx) => {
      await this.checkAccountCapacity(id_account, tx);

      const created = await tx.user.create({
        data: {
          idAccount: id_account,
          branch,
          userNumber,
          email: dto.email,
          passwordHash,
          role: dto.role,
          status: GenericStatus.active,
          createdAt: now,
          profile: {
            create: {
              name: dto.name,
              lastName: dto.last_name,
              phone: dto.phone ?? null,
              emergencyPhone: dto.emergency_phone ?? null,
              timeSessionAlive: 7,
              status: GenericStatus.active,
              createdAt: now,
            },
          },
        },
        include: { profile: true },
      });

      const defaultFeatures = await tx.feature.findMany({
        where: {
          role: created.role,
          customizable: false,
          status: GenericStatus.active,
        },
      });

      if (defaultFeatures.length > 0) {
        await tx.featureFlag.createMany({
          data: defaultFeatures.map((f) => ({
            idUser: created.idUser,
            idFeature: f.idFeature,
            status: GenericStatus.active,
          })),
        });
      }

      return created;
    });

    const p = row.profile!;

    return {
      id_user: row.idUser,
      id_account: row.idAccount,
      branch: row.branch,
      user_number: row.userNumber,
      email: row.email,
      role: row.role,
      status: row.status,
      created_at: row.createdAt,
      name: p.name,
      last_name: p.lastName,
      phone: p.phone,
      emergency_phone: p.emergencyPhone,
    };
  }
}
