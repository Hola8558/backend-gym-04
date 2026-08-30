import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { addUtcDays, startOfUtcDay } from '../common/utils/utc-date.util';
import { hasPrismaTargetField } from '../core/prisma/utils/prisma-error-target.util';
import { MembershipAuditService } from '../membership-audit/membership-audit.service';
import { MembershipAction } from '../membership-audit/types/membership-action.const';
import { membershipRowDatesToAudit } from '../membership-audit/utils/membership-history-date.util';
import { PrismaService } from '../core/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { findNonDeletedUserByEmailInAccount } from './utils/find-non-deleted-user-by-email-in-account.util';

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
  birthdate: true,
  role: true,
  editAt: true,
  status: true,
  profile: true,
} as const satisfies Prisma.UserSelect;

@Injectable()
export class SharedUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly membershipAuditService: MembershipAuditService,
  ) {}

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

  private buildUserUpdateInput(
    dto: UpdateUserDto,
    role: UserRole,
  ): Prisma.UserUpdateInput {
    const data: Prisma.UserUpdateInput = {};

    if (dto.email !== undefined) {
      data.email = dto.email;
    }
    if (dto.branch !== undefined) {
      data.branch = dto.branch;
    }
    if (dto.birthdate !== undefined) {
      const raw = dto.birthdate;
      if (
        raw === null ||
        raw === '' ||
        (typeof raw === 'string' && raw.trim() === '')
      ) {
        data.birthdate = null;
      } else {
        data.birthdate = new Date(
          String(raw).slice(0, 10) + 'T00:00:00.000Z',
        );
      }
    }

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
    if (dto.observations !== undefined) {
      profileUpdate.observations = dto.observations;
    }
    if (role === UserRole.customer && dto.coachId !== undefined) {
      profileUpdate.coach = { connect: { idUser: dto.coachId } };
    }

    if (Object.keys(profileUpdate).length > 0) {
      data.profile = { update: profileUpdate };
    }

    return data;
  }

  /**
   * Upserts the single CustomerMembership row for this user (one row per user, no history).
   */
  private async upsertCustomerMembershipSingleRow(
    tx: Prisma.TransactionClient,
    idAccount: number,
    idUser: number,
    idMembershipType: number,
  ): Promise<void> {
    const membershipType = await tx.membershipType.findFirst({
      where: {
        idAccount,
        idMembershipType,
        status: { not: GenericStatus.deleted },
      },
    });
    if (!membershipType) {
      throw new NotFoundException(
        'CUSTOMERS.FORM.ERRORS.MEMBERSHIP_TYPE_NOT_FOUND',
      );
    }

    const startDate = startOfUtcDay(new Date());
    const endDate = addUtcDays(startDate, membershipType.durationDays);
    const now = new Date();

    const existing = await tx.customerMembership.findUnique({
      where: { idUser },
    });

    if (existing) {
      await tx.customerMembership.update({
        where: { idCustomerMembership: existing.idCustomerMembership },
        data: {
          idAccount,
          idMembershipType,
          startDate,
          endDate,
          status: GenericStatus.active,
        },
      });
    } else {
      await tx.customerMembership.create({
        data: {
          idAccount,
          idUser,
          idMembershipType,
          startDate,
          endDate,
          status: GenericStatus.active,
          createdAt: now,
        },
      });
    }

    const after = await tx.customerMembership.findUnique({
      where: { idUser },
      select: {
        idCustomerMembership: true,
        startDate: true,
        endDate: true,
        idMembershipType: true,
        status: true,
      },
    });
    if (!after) {
      return;
    }

    if (!existing) {
      const { startDate: adStart, endDate: adEnd } = membershipRowDatesToAudit(
        new Date(after.startDate),
        after.endDate != null ? new Date(after.endDate) : null,
      );
      await this.membershipAuditService.logMovement(
        {
          idAccount,
          idUser,
          idNewMembership: after.idCustomerMembership,
          idOldMembership: null,
          actionType: MembershipAction.NEW,
          startDate: adStart,
          endDate: adEnd,
        },
        tx,
      );
      return;
    }

    const typeChanged = existing.idMembershipType !== idMembershipType;
    const actionType = typeChanged
      ? MembershipAction.CHANGE
      : MembershipAction.RENEWAL;
    const { startDate: adStart, endDate: adEnd } = membershipRowDatesToAudit(
      new Date(after.startDate),
      after.endDate != null ? new Date(after.endDate) : null,
    );
    await this.membershipAuditService.logMovement(
      {
        idAccount,
        idUser,
        idNewMembership: after.idCustomerMembership,
        idOldMembership: existing.idCustomerMembership,
        actionType,
        startDate: adStart,
        endDate: adEnd,
      },
      tx,
    );
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

    const hasMembershipUpdate =
      role === UserRole.customer &&
      dto.membershipId !== undefined &&
      dto.membershipId !== null;

    const data = this.buildUserUpdateInput(dto, role);
    const hasAnyUserUpdate = Object.keys(data).length > 0;

    if (role === UserRole.customer && dto.coachId !== undefined) {
      const coach = await this.prisma.user.findFirst({
        where: {
          idUser: dto.coachId,
          idAccount: existing.idAccount,
          role: UserRole.coach,
          status: GenericStatus.active,
        },
      });
      if (!coach) {
        throw new BadRequestException('CUSTOMERS.FORM.ERRORS.INVALID_COACH');
      }
    }

    if (!hasAnyUserUpdate && !hasMembershipUpdate) {
      return existing;
    }

    if (dto.email !== undefined && dto.email.trim() !== '') {
      const emailConflict = await findNonDeletedUserByEmailInAccount(
        this.prisma,
        existing.idAccount,
        dto.email,
        id_user,
      );
      if (emailConflict) {
        throw new ConflictException(
          'CUSTOMERS.FORM.ERRORS.EMAIL_ALREADY_EXISTS',
        );
      }
    }

    if (hasMembershipUpdate) {
      return await this.prisma.$transaction(async (tx) => {
        await this.upsertCustomerMembershipSingleRow(
          tx,
          existing.idAccount,
          id_user,
          dto.membershipId!,
        );

        if (!hasAnyUserUpdate) {
          return tx.user.findFirst({
            where: { idUser: id_user },
            select: userPublicSelect,
          });
        }

        try {
          return await tx.user.update({
            where: { idUser: id_user },
            data,
            select: userPublicSelect,
          });
        } catch (error) {
          if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2002' &&
            hasPrismaTargetField(error.meta?.target, 'email')
          ) {
            throw new ConflictException(
              'CUSTOMERS.FORM.ERRORS.EMAIL_ALREADY_EXISTS',
            );
          }
          throw error;
        }
      });
    }

    try {
      return await this.prisma.user.update({
        where: { idUser: id_user },
        data,
        select: userPublicSelect,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        hasPrismaTargetField(error.meta?.target, 'email')
      ) {
        throw new ConflictException(
          'CUSTOMERS.FORM.ERRORS.EMAIL_ALREADY_EXISTS',
        );
      }

      throw error;
    }
  }

  async softDeleteUser(
    id_user: number,
    id_account: number,
    role: UserRole,
    actor_user_id?: number,
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
        data: {
          status: GenericStatus.deleted,
          ...(actor_user_id !== undefined
            ? { deletedById: actor_user_id }
            : {}),
        },
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

    if (role === UserRole.customer && actor_user_id !== undefined) {
      await this.activityLogsService.logAction(
        id_account,
        actor_user_id,
        'DELETE',
        'CUSTOMER',
        row.idUser,
        {
          previous_status: row.status,
          new_status: GenericStatus.deleted,
        },
      );
    }

    return true;
  }

  /**
   * Restores a soft-deleted user (and profile) to `active` and clears `deletedById`.
   */
  async recoverSoftDeletedUser(
    id_user: number,
    id_account: number,
    role: UserRole,
  ): Promise<boolean> {
    const row = await this.prisma.user.findFirst({
      where: {
        idUser: id_user,
        idAccount: id_account,
        role,
        status: GenericStatus.deleted,
      },
      select: { idUser: true },
    });
    if (!row) {
      return false;
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { idUser: id_user },
        data: {
          status: GenericStatus.active,
          deletedById: null,
        },
      });
      const prof = await tx.profile.findUnique({
        where: { idUser: id_user },
      });
      if (prof) {
        await tx.profile.update({
          where: { idUser: id_user },
          data: { status: GenericStatus.active },
        });
      }
    });
    return true;
  }
}
