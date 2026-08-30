import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { plainToInstance } from 'class-transformer';
import { addUtcDays, startOfUtcDay } from '../common/utils/utc-date.util';
import { MembershipAuditService } from '../membership-audit/membership-audit.service';
import { MembershipAction } from '../membership-audit/types/membership-action.const';
import { membershipRowDatesToAudit } from '../membership-audit/utils/membership-history-date.util';
import { PrismaService } from '../core/prisma/prisma.service';
import { AssignMembershipDto } from './dto/assign-membership.dto';
import { CustomerMembershipResponseDto } from './dto/customer-membership-response.dto';

@Injectable()
export class CustomerMembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipAuditService: MembershipAuditService,
  ) {}

  async assign(
    idAccount: number,
    dto: AssignMembershipDto,
  ): Promise<CustomerMembershipResponseDto> {
    const targetUser = await this.prisma.user.findFirst({
      where: {
        idUser: dto.id_user,
        idAccount,
        // Align with default `GET /customer` list (active + inactive + pending; not deleted/banned).
        status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
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
      const dtoResponse = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.customerMembership.findUnique({
          where: { idUser: dto.id_user },
        });

        const row = await tx.customerMembership.upsert({
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

        if (targetUser.status !== GenericStatus.active) {
          await tx.user.update({
            where: { idUser: dto.id_user },
            data: { status: GenericStatus.active },
          });
          await tx.profile.updateMany({
            where: { idUser: dto.id_user },
            data: { status: GenericStatus.active },
          });
        }

        const actionType = !existing
          ? MembershipAction.NEW
          : existing.status === GenericStatus.active
            ? MembershipAction.RENEWAL
            : MembershipAction.CHANGE;

        const idOldMembership =
          actionType === MembershipAction.NEW ? null : existing!.idCustomerMembership;

        const { startDate: adStart, endDate: adEnd } = membershipRowDatesToAudit(
          new Date(row.startDate),
          row.endDate != null ? new Date(row.endDate) : null,
        );

        await this.membershipAuditService.logMovement(
          {
            idAccount,
            idUser: dto.id_user,
            idNewMembership: row.idCustomerMembership,
            idOldMembership,
            actionType,
            startDate: adStart,
            endDate: adEnd,
          },
          tx,
        );

        return row;
      });

      return plainToInstance(
        CustomerMembershipResponseDto,
        {
          startDate: dtoResponse.startDate,
          endDate: dtoResponse.endDate,
          status: dtoResponse.status,
          membershipType: {
            name: dtoResponse.membershipType.name,
            price: dtoResponse.membershipType.price.toString(),
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
