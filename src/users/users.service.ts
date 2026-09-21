import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { addUtcDays, startOfUtcDay } from '../common/utils/utc-date.util';
import { hasPrismaTargetField } from '../core/prisma/utils/prisma-error-target.util';
import { MembershipAuditService } from '../membership-audit/membership-audit.service';
import { MembershipAction } from '../membership-audit/types/membership-action.const';
import { membershipRowDatesToAudit } from '../membership-audit/utils/membership-history-date.util';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { findNonDeletedUserByEmailInAccount } from './utils/find-non-deleted-user-by-email-in-account.util';
import { generateUserNumber } from './utils/generate-user-number.util';
import type { BulkImportCustomerCoercedRow } from './types/bulk-import-customer-row.type';
import { resolveBulkImportEmailCandidate } from './utils/resolve-bulk-import-email.util';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly membershipAuditService: MembershipAuditService,
  ) {}

  private async buildFeatureFlagCreates(
    role: UserRole,
    tx: Prisma.TransactionClient,
  ): Promise<Prisma.FeatureFlagCreateWithoutUserInput[]> {
    const features = await tx.feature.findMany({
      where: {
        role,
        status: GenericStatus.active,
      },
      select: {
        idFeature: true,
        customizable: true,
      },
    });

    if (features.length === 0) {
      return [];
    }

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

  private async assertCoachInAccount(
    tx: Prisma.TransactionClient,
    idAccount: number,
    coachId: number,
  ): Promise<void> {
    const coach = await tx.user.findFirst({
      where: {
        idUser: coachId,
        idAccount,
        role: UserRole.coach,
        status: GenericStatus.active,
      },
    });
    if (!coach) {
      throw new BadRequestException('CUSTOMERS.FORM.ERRORS.INVALID_COACH');
    }
  }

  async createUserWithProfile(
    dto: CreateUserDto,
    id_account: number,
    current_user_id?: number,
  ): Promise<CreateUserResponse> {
    const branch = dto.branch ?? 'A';
    const userNumber = generateUserNumber();
    const now = new Date();
    const plainPassword =
      dto.password != null && dto.password.trim().length > 0
        ? dto.password.trim()
        : dto.role === UserRole.coach || dto.role === UserRole.customer
          ? userNumber
          : null;
    if (plainPassword == null) {
      throw new BadRequestException('USERS.ERRORS.PASSWORD_REQUIRED');
    }
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        await this.checkAccountCapacity(id_account, tx);
        const featureFlagCreates = await this.buildFeatureFlagCreates(
          dto.role,
          tx,
        );

        let membershipTypeForCreate: { durationDays: number } | null = null;
        if (
          dto.role === UserRole.customer &&
          dto.membershipId !== undefined &&
          dto.membershipId !== null
        ) {
          const mt = await tx.membershipType.findFirst({
            where: {
              idAccount: id_account,
              idMembershipType: dto.membershipId,
              status: { not: GenericStatus.deleted },
            },
          });
          if (!mt) {
            throw new NotFoundException(
              'CUSTOMERS.FORM.ERRORS.MEMBERSHIP_TYPE_NOT_FOUND',
            );
          }
          membershipTypeForCreate = mt;
        }

        if (
          dto.role === UserRole.customer &&
          dto.coachId !== undefined &&
          dto.coachId !== null
        ) {
          await this.assertCoachInAccount(tx, id_account, dto.coachId);
        }

        if (dto.email != null && dto.email.trim() !== '') {
          const emailConflict = await findNonDeletedUserByEmailInAccount(
            tx,
            id_account,
            dto.email,
          );
          if (emailConflict) {
            throw new ConflictException(
              'CUSTOMERS.FORM.ERRORS.EMAIL_ALREADY_EXISTS',
            );
          }
        }

        const profileCreate: Prisma.ProfileCreateWithoutUserInput = {
          name: dto.name,
          lastName: dto.last_name,
          phone: dto.phone ?? null,
          emergencyPhone: dto.emergency_phone ?? null,
          observations: dto.observations ?? null,
          timeSessionAlive: 7,
          status: GenericStatus.active,
          createdAt: now,
        };

        if (
          dto.role === UserRole.customer &&
          dto.coachId !== undefined &&
          dto.coachId !== null
        ) {
          profileCreate.coach = { connect: { idUser: dto.coachId } };
        }

        const created = await tx.user.create({
          data: {
            account: {
              connect: { idAccount: id_account },
            },
            branch,
            userNumber,
            email: dto.email,
            passwordHash,
            role: dto.role,
            status: GenericStatus.active,
            ...(dto.birthdate != null && String(dto.birthdate).trim() !== ''
              ? {
                  birthdate: new Date(
                    String(dto.birthdate).slice(0, 10) + 'T00:00:00.000Z',
                  ),
                }
              : {}),
            requiresPasswordChange:
              dto.role === UserRole.coach || dto.role === UserRole.customer,
            profile: {
              create: profileCreate,
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

        if (
          dto.role === UserRole.customer &&
          dto.membershipId !== undefined &&
          dto.membershipId !== null &&
          membershipTypeForCreate
        ) {
          const startDate = startOfUtcDay(new Date());
          const endDate = addUtcDays(
            startDate,
            membershipTypeForCreate.durationDays,
          );
          const membership = await tx.customerMembership.create({
            data: {
              idAccount: id_account,
              idUser: created.idUser,
              idMembershipType: dto.membershipId,
              startDate,
              endDate,
              status: GenericStatus.active,
              createdAt: now,
            },
            select: {
              idCustomerMembership: true,
              startDate: true,
              endDate: true,
            },
          });
          const { startDate: adStart, endDate: adEnd } = membershipRowDatesToAudit(
            new Date(membership.startDate),
            membership.endDate != null ? new Date(membership.endDate) : null,
          );
          await this.membershipAuditService.logMovement(
            {
              idAccount: id_account,
              idUser: created.idUser,
              idNewMembership: membership.idCustomerMembership,
              idOldMembership: null,
              actionType: MembershipAction.NEW,
              startDate: adStart,
              endDate: adEnd,
            },
            tx,
          );
        }

        return created;
      });

      if (dto.role === UserRole.customer && current_user_id !== undefined) {
        await this.activityLogsService.logAction(
          id_account,
          current_user_id,
          'CREATE',
          'CUSTOMER',
          row.idUser,
          {
            name: row.profile?.name ?? null,
            email: row.email ?? null,
          },
        );
      }

      const p = row.profile!;

      return {
        user_number: row.userNumber,
        email: hiddenEmail(row.email),
        name: p.name,
        last_name: p.lastName,
        phone: p.phone,
        emergency_phone: p.emergencyPhone,
      };
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

  async createCustomerFromBulkImport(
    id_account: number,
    row: BulkImportCustomerCoercedRow,
    current_user_id?: number,
  ): Promise<CreateUserResponse | null> {
    const maxAttempts = 20;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.createCustomerFromBulkImportAttempt(
          id_account,
          row,
          current_user_id,
          attempt,
        );
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < maxAttempts - 1
        ) {
          continue;
        }

        if (attempt < maxAttempts - 1) {
          continue;
        }

        return null;
      }
    }

    return null;
  }

  private async createCustomerFromBulkImportAttempt(
    id_account: number,
    row: BulkImportCustomerCoercedRow,
    current_user_id: number | undefined,
    attempt: number,
  ): Promise<CreateUserResponse> {
    const branch = 'A';
    const userNumber = generateUserNumber();
    const now = new Date();
    const email = resolveBulkImportEmailCandidate(row.email, attempt);
    const passwordHash = await bcrypt.hash(userNumber, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const featureFlagCreates = await this.buildFeatureFlagCreates(
        UserRole.customer,
        tx,
      );

      const profileCreate: Prisma.ProfileCreateWithoutUserInput = {
        name: row.name,
        lastName: row.lastname,
        phone: row.phone,
        emergencyPhone: row.emergency_phone,
        observations: row.observations,
        timeSessionAlive: 7,
        status: GenericStatus.active,
        createdAt: now,
      };

      return tx.user.create({
        data: {
          account: {
            connect: { idAccount: id_account },
          },
          branch,
          userNumber,
          email,
          passwordHash,
          role: UserRole.customer,
          status: GenericStatus.active,
          requiresPasswordChange: true,
          ...(row.birthdate ? { birthdate: row.birthdate } : {}),
          profile: {
            create: profileCreate,
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
    });

    if (current_user_id !== undefined) {
      await this.activityLogsService.logAction(
        id_account,
        current_user_id,
        'CREATE',
        'CUSTOMER',
        created.idUser,
        {
          name: created.profile?.name ?? null,
          email: created.email ?? null,
          source: 'bulk_import',
        },
      );
    }

    const profile = created.profile!;

    return {
      user_number: created.userNumber,
      email: hiddenEmail(created.email),
      name: profile.name,
      last_name: profile.lastName,
      phone: profile.phone,
      emergency_phone: profile.emergencyPhone,
    };
  }
}
