import { Injectable } from '@nestjs/common';
import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

function tenantRoleWhere(id_account: number, role: UserRole) {
  return {
    idAccount: id_account,
    role,
    status: { not: GenericStatus.deleted },
  };
}

/** Safe user fields for API responses (excludes passwordHash). */
const userPublicSelect = {
  idUser: true,
  idAccount: true,
  branch: true,
  userNumber: true,
  email: true,
  role: true,
  createdAt: true,
  status: true,
  profile: true,
} as const satisfies Prisma.UserSelect;

@Injectable()
export class SharedUsersService {
  constructor(private readonly prisma: PrismaService) {}

  findManyByRole(id_account: number, role: UserRole) {
    return this.prisma.user.findMany({
      where: tenantRoleWhere(id_account, role),
      select: userPublicSelect,
      orderBy: { idUser: 'asc' },
    });
  }

  findOneByIdAndRole(id_user: number, id_account: number, role: UserRole) {
    return this.prisma.user.findFirst({
      where: {
        idUser: id_user,
        ...tenantRoleWhere(id_account, role),
      },
      select: userPublicSelect,
    });
  }

  async updateUser(
    id_user: number,
    id_account: number,
    role: UserRole,
    dto: UpdateUserDto,
  ) {
    const existing = await this.findOneByIdAndRole(id_user, id_account, role);
    if (!existing) {
      return null;
    }

    const hasUser =
      dto.email !== undefined || dto.branch !== undefined;
    const hasProfile =
      dto.name !== undefined ||
      dto.last_name !== undefined ||
      dto.phone !== undefined ||
      dto.emergency_phone !== undefined;

    if (!hasUser && !hasProfile) {
      return existing;
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.email !== undefined) {
      data.email = dto.email;
    }
    if (dto.branch !== undefined) {
      data.branch = dto.branch;
    }

    if (hasProfile) {
      const profileUpdate: Prisma.ProfileUpdateWithoutUserInput = {};
      if (dto.name !== undefined) {
        profileUpdate.name = dto.name;
      }
      if (dto.last_name !== undefined) {
        profileUpdate.lastName = dto.last_name;
      }
      if (dto.phone !== undefined) {
        profileUpdate.phone = dto.phone;
      }
      if (dto.emergency_phone !== undefined) {
        profileUpdate.emergencyPhone = dto.emergency_phone;
      }
      data.profile = { update: profileUpdate };
    }

    return this.prisma.user.update({
      where: { idUser: id_user },
      data,
      select: userPublicSelect,
    });
  }

  async softDeleteUser(
    id_user: number,
    id_account: number,
    role: UserRole,
  ): Promise<boolean> {
    const row = await this.prisma.user.findFirst({
      where: {
        idUser: id_user,
        ...tenantRoleWhere(id_account, role),
      },
    });
    if (!row) {
      return false;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { idUser: id_user },
        data: { status: GenericStatus.deleted },
      });
      const prof = await tx.profile.findUnique({
        where: { idUser: id_user },
      });
      if (prof) {
        await tx.profile.update({
          where: { idUser: id_user },
          data: { status: GenericStatus.deleted },
        });
      }
    });

    return true;
  }
}
