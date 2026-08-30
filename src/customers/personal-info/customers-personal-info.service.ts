import { Injectable, NotFoundException } from '@nestjs/common';
import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PersonalInfoResponseDto } from './dto/personal-info-response.dto';
import { UpdatePersonalInfoDto } from './dto/update-personal-info.dto';
import type { PersonalInfoSource } from './types/personal-info-source.type';
import { toPersonalInfoResponseDto } from './utils/personal-info-response.mapper';

const personalInfoSelect = {
  email: true,
  userNumber: true,
  profile: {
    select: {
      name: true,
      lastName: true,
      phone: true,
      emergencyPhone: true,
    },
  },
} as const satisfies Prisma.UserSelect;

@Injectable()
export class CustomersPersonalInfoService {
  constructor(private readonly prisma: PrismaService) {}

  async getPersonalInfo(
    customerId: number,
    idAccount: number,
  ): Promise<PersonalInfoResponseDto> {
    const row = await this.findCustomerPersonalInfoRow(customerId, idAccount);
    return toPersonalInfoResponseDto(row);
  }

  async updatePersonalInfo(
    customerId: number,
    idAccount: number,
    updateDto: UpdatePersonalInfoDto,
  ): Promise<PersonalInfoResponseDto> {
    await this.findCustomerPersonalInfoRow(customerId, idAccount);

    const profileUpdate: Prisma.ProfileUpdateInput = {};

    if (updateDto.name !== undefined) {
      const trimmed = updateDto.name.trim();
      profileUpdate.name = trimmed.length > 0 ? trimmed : null;
      profileUpdate.lastName = null;
    }

    if (updateDto.phone_number !== undefined) {
      const trimmed = updateDto.phone_number.trim();
      profileUpdate.phone = trimmed.length > 0 ? trimmed : null;
    }

    if (updateDto.emergency_phone_number !== undefined) {
      const trimmed = updateDto.emergency_phone_number.trim();
      profileUpdate.emergencyPhone = trimmed.length > 0 ? trimmed : null;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await this.prisma.profile.update({
        where: { idUser: customerId },
        data: profileUpdate,
      });
    }

    const updated = await this.findCustomerPersonalInfoRow(customerId, idAccount);
    return toPersonalInfoResponseDto(updated);
  }

  private async findCustomerPersonalInfoRow(
    customerId: number,
    idAccount: number,
  ): Promise<PersonalInfoSource> {
    const row = await this.prisma.user.findFirst({
      where: {
        idUser: customerId,
        idAccount,
        role: UserRole.customer,
        status: GenericStatus.active,
      },
      select: personalInfoSelect,
    });

    if (!row?.profile) {
      throw new NotFoundException('CUSTOMERS.ERRORS.PERSONAL_INFO_NOT_FOUND');
    }

    return row as PersonalInfoSource;
  }
}
