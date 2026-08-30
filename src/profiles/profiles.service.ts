import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, UserRole } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../core/prisma/prisma.service';
import { hasPrismaTargetField } from '../core/prisma/utils/prisma-error-target.util';
import { generateChangeKey } from '../settings/utils/generate-change-key.util';
import { findNonDeletedUserByEmailInAccount } from '../users/utils/find-non-deleted-user-by-email-in-account.util';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { canUpdateBusinessName } from './utils/can-update-business-name.util';
import { mapProfileResponse } from './utils/map-profile-response.util';

const PROFILE_SELECT = {
  email: true,
  role: true,
  account: {
    select: {
      name: true,
    },
  },
  profile: {
    select: {
      name: true,
      lastName: true,
      phone: true,
      createdAt: true,
    },
  },
} as const;

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentProfile(
    idUser: number,
    idAccount: number,
  ): Promise<ProfileResponseDto> {
    const row = await this.prisma.user.findFirst({
      where: {
        idUser,
        idAccount,
        status: { not: GenericStatus.deleted },
      },
      select: PROFILE_SELECT,
    });

    if (!row) {
      throw new NotFoundException('PROFILE.ERRORS.NOT_FOUND');
    }

    return mapProfileResponse(row);
  }

  async updateCurrentProfile(
    idUser: number,
    idAccount: number,
    role: UserRole,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const existing = await this.prisma.user.findFirst({
      where: {
        idUser,
        idAccount,
        status: { not: GenericStatus.deleted },
      },
      select: {
        idUser: true,
        idAccount: true,
        profile: {
          select: { idUser: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('PROFILE.ERRORS.NOT_FOUND');
    }

    if (dto.business_name !== undefined && !canUpdateBusinessName(role)) {
      throw new ForbiddenException('PROFILE.ERRORS.BUSINESS_NAME_FORBIDDEN');
    }

    if (dto.email !== undefined) {
      const emailConflict = await findNonDeletedUserByEmailInAccount(
        this.prisma,
        idAccount,
        dto.email,
        idUser,
      );
      if (emailConflict) {
        throw new ConflictException('PROFILE.ERRORS.EMAIL_ALREADY_EXISTS');
      }
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        if (dto.email !== undefined) {
          await tx.user.update({
            where: { idUser },
            data: { email: dto.email.trim() },
          });
        }

        if (dto.phone !== undefined && existing.profile) {
          const phone = dto.phone.trim();
          await tx.profile.update({
            where: { idUser },
            data: { phone: phone === '' ? null : phone },
          });
        }

        if (dto.business_name !== undefined) {
          const businessName = dto.business_name.trim();
          await tx.account.update({
            where: { idAccount },
            data: { name: businessName },
          });
          await tx.accountDetail.update({
            where: { idAccount },
            data: { nameKeyChange: generateChangeKey() },
          });
        }
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        hasPrismaTargetField(error.meta?.target, 'email')
      ) {
        throw new ConflictException('PROFILE.ERRORS.EMAIL_ALREADY_EXISTS');
      }
      throw error;
    }

    return this.getCurrentProfile(idUser, idAccount);
  }
}
