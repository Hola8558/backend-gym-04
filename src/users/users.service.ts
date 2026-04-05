import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ROLE_FEATURE_MAP } from '../common/constants/role-features.constant';
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

/** Masks local part: first 2 chars + 7 asterisks + last char before @ (e.g. cu*******1@gmail.com). */
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

export type CreateUserResponse = {
  user_number: string | null;
  email: string | null;
  name: string | null;
  last_name: string | null;
  phone: string | null;
  emergency_phone: string | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildFeatureFlagCreates(
    role: UserRole,
    tx: Prisma.TransactionClient,
  ): Promise<Prisma.FeatureFlagCreateWithoutUserInput[]> {
    const allowedFeatureNames = ROLE_FEATURE_MAP[role] ?? [];
    if (allowedFeatureNames.length === 0) {
      return [];
    }

    const features = await tx.feature.findMany({
      where: {
        name: { in: allowedFeatureNames },
        status: GenericStatus.active,
      },
      select: {
        idFeature: true,
        customizable: true,
      },
    });

    return features.map((feature) => ({
      status: feature.customizable
        ? GenericStatus.inactive
        : GenericStatus.active,
      feature: {
        connect: { idFeature: feature.idFeature },
      },
    }));
  }

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
      const featureFlagCreates = await this.buildFeatureFlagCreates(dto.role, tx);

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
          featureFlags:
            featureFlagCreates.length > 0
              ? {
                  create: featureFlagCreates,
                }
              : undefined,
        },
        include: { profile: true },
      });

      return created;
    });

    const p = row.profile!;

    return {
      user_number: row.userNumber,
      email: hiddenEmail(row.email),
      name: p.name,
      last_name: p.lastName,
      phone: p.phone,
      emergency_phone: p.emergencyPhone,
    };
  }
}
