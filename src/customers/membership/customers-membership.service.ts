import { Injectable, NotFoundException } from '@nestjs/common';
import { GenericStatus } from '@prisma/client';
import { accountRequiresCustomerMembership } from '../../auth/utils/account-requires-customer-membership.util';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MobileCustomerMembershipResponseDto } from './dto/mobile-customer-membership-response.dto';
import { toMobileCustomerMembershipResponseDto } from './utils/mobile-customer-membership.mapper';

@Injectable()
export class CustomersMembershipService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the JWT customer's membership plan + assignment dates.
   * Solo coach without feature 5006 and no row → null.
   * Otherwise missing row → 404.
   */
  async getMembershipForCustomer(
    idUser: number,
    idAccount: number,
  ): Promise<MobileCustomerMembershipResponseDto | null> {
    const account = await this.prisma.account.findFirst({
      where: {
        idAccount,
        status: { not: GenericStatus.deleted },
      },
      select: { type: true },
    });

    if (!account) {
      throw new NotFoundException('CUSTOMERS.ERRORS.MEMBERSHIP_NOT_FOUND');
    }

    const row = await this.prisma.customerMembership.findFirst({
      where: {
        idUser,
        idAccount,
      },
      select: {
        startDate: true,
        endDate: true,
        status: true,
        membershipType: {
          select: {
            idMembershipType: true,
            name: true,
            features: true,
            price: true,
            durationDays: true,
            status: true,
          },
        },
      },
    });

    if (row) {
      return toMobileCustomerMembershipResponseDto(row);
    }

    const requiresMembership = await accountRequiresCustomerMembership(
      this.prisma,
      idAccount,
      account.type,
    );

    if (!requiresMembership) {
      return null;
    }

    throw new NotFoundException('CUSTOMERS.ERRORS.MEMBERSHIP_NOT_FOUND');
  }
}
