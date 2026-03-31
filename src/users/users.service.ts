import { Injectable } from '@nestjs/common';
import { GenericStatus, UserRole } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const USER_NUMBER_ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateUserNumber(): string {
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += USER_NUMBER_ALPHANUM[randomInt(USER_NUMBER_ALPHANUM.length)];
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

  async createUserWithProfile(dto: CreateUserDto): Promise<CreateUserResponse> {
    const branch = dto.branch ?? 'A';
    const userNumber = generateUserNumber();
    const now = new Date();

    const row = await this.prisma.user.create({
      data: {
        idAccount: dto.id_account,
        branch,
        userNumber,
        email: dto.email,
        passwordHash: dto.password_hash,
        role: dto.role,
        status: GenericStatus.active,
        createdAt: now,
        profile: {
          create: {
            name: dto.name,
            lastName: dto.last_name,
            phone: dto.phone ?? null,
            emergencyPhone: dto.emergency_phone ?? null,
            status: GenericStatus.active,
            createdAt: now,
          },
        },
      },
      include: { profile: true },
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
