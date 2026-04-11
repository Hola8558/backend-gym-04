import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { plainToInstance } from 'class-transformer';
import { addUtcDays, startOfUtcDay } from '../common/utils/utc-date.util';
import { PrismaService } from '../core/prisma/prisma.service';
import { AssignMembershipDto } from './dto/assign-membership.dto';
import { CustomerMembershipResponseDto } from './dto/customer-membership-response.dto';

@Injectable()
export class CustomerMembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async assign(
    idAccount: number,
    dto: AssignMembershipDto,
  ): Promise<CustomerMembershipResponseDto> {
    const targetUser = await this.prisma.user.findFirst({
      where: {
        idUser: dto.id_user,
        idAccount,
        status: GenericStatus.active,
      },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found in this account');
    }

    const membershipType = await this.prisma.membershipType.findFirst({
      where: {
        idAccount,
        idMembershipType: dto.id_membership_type,
        status: { not: GenericStatus.deleted },
      },
    });
    if (!membershipType) {
      throw new NotFoundException('Membership type not found in this account');
    }

    const startDate = startOfUtcDay(new Date());
    const endDate = addUtcDays(startDate, membershipType.durationDays);

    const now = new Date();

    try {
      const row = await this.prisma.customerMembership.upsert({
        where: { idUser: dto.id_user },
        create: {
          idAccount,
          idUser: dto.id_user,
          idMembershipType: dto.id_membership_type,
          startDate,
          endDate,
          status: GenericStatus.active,
          createdAt: now,
        },
        update: {
          idAccount,
          idMembershipType: dto.id_membership_type,
          startDate,
          endDate,
          status: GenericStatus.active,
        },
        include: { membershipType: true },
      });

      return plainToInstance(
        CustomerMembershipResponseDto,
        {
          startDate: row.startDate,
          endDate: row.endDate,
          status: row.status,
          membershipType: {
            name: row.membershipType.name,
            price: row.membershipType.price.toString(),
          },
        },
        { excludeExtraneousValues: true },
      );
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ForbiddenException(
          'Cannot assign membership: invalid membership type reference',
        );
      }
      throw e;
    }
  }
}
