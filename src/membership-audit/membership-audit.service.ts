import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import type { LogMembershipMovementParams } from './types/log-membership-movement.params';
import { membershipRowDatesToAudit } from './utils/membership-history-date.util';

@Injectable()
export class MembershipAuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Writes a membership_histories row. Pass `tx` when called inside an existing transaction
   * so the audit row commits or rolls back with the caller.
   */
  async logMovement(
    params: LogMembershipMovementParams,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.membershipHistory.create({
      data: {
        idAccount: params.idAccount,
        idUser: params.idUser,
        idNewMembership: params.idNewMembership,
        idOldMembership: params.idOldMembership,
        actionType: params.actionType as never,
        ...membershipRowDatesToAudit(params.startDate, params.endDate),
      },
    });
  }
}
