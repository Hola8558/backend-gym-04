import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BanStatus, GenericStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  addUtcDays,
  startOfUtcDay,
  subUtcDays,
  utcWholeCalendarDaysBetween,
} from '../common/utils/utc-date.util';
import {
  getLocalHourInZone,
  getZonedCalendarDayRangeUtc,
} from '../common/utils/zoned-day-range.util';
import { MembershipAuditService } from '../membership-audit/membership-audit.service';
import { MembershipAction } from '../membership-audit/types/membership-action.const';
import { membershipRowDatesToAudit } from '../membership-audit/utils/membership-history-date.util';
import { PrismaService } from '../core/prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AuthService } from '../auth/auth.service';
import { accountRequiresCustomerMembership } from '../auth/utils/account-requires-customer-membership.util';
import { RoutineHydrationService } from '../routines/routine-hydration.service';
import {
  DASHBOARD_FEATURE_ENTRY_LOGS,
  DASHBOARD_FEATURE_MEMBERSHIP_MANAGEMENT,
} from '../dashboard/dashboard-metrics-gates';
import { evaluateDashboardMetricsGates } from '../dashboard/dashboard-metrics-gates';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { SharedUsersService } from '../users/shared-users.service';
import { BanCustomerDto } from './dto/ban-customer.dto';
import { BannedCustomerResponseDto } from './dto/banned-customer-response.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomerBanHistoryEntryDto } from './dto/customer-ban-history-entry.dto';
import { DeletedCustomerResponseDto } from './dto/deleted-customer-response.dto';
import {
  CustomerRecoveryTypeDto,
  RecoverCustomerDto,
} from './dto/recover-customer.dto';
import { UnbanCustomerDto } from './dto/unban-customer.dto';
import type { BannedBanRowSource } from './types/banned-customer-source.type';
import type { CustomerBanHistoryRow } from './types/customer-ban-history-source.type';
import { CustomerSource } from './types/customer-source.type';
import { DeletedCustomerSource } from './types/deleted-customer-source.type';
import { toBannedCustomerResponseDto } from './utils/banned-customer-response.mapper';
import { accountUsesMembershipManagedCustomerStatus } from './utils/account-uses-membership-managed-customer-status.util';
import {
  buildMembershipManagedActiveCustomerWhere,
  buildMembershipManagedInactiveCustomerWhere,
} from './utils/build-membership-managed-customer-status-where.util';
import { toCustomerResponseDto } from './utils/customer-response.mapper';
import { toCustomerBanHistoryEntryDto } from './utils/customer-ban-history.mapper';
import { isValidCustomerMembershipToday } from './utils/is-valid-customer-membership.util';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { MobileCustomerLoginResponseDto } from './dto/mobile-customer-login-response.dto';
import { toDeletedCustomerResponseDto } from './utils/deleted-customer-response.mapper';
import type { CustomerListFilters } from './types/customer-list-filters.type';
import type { DashboardSignUpHalf } from './types/dashboard-sign-up-half';
import { obfuscateEmailForMobile } from './utils/obfuscate-email.util';
import { buildMobileRoutineItems } from './utils/mobile-routine-items.util';
import { SyncRoutineDto } from './dto/sync-routine.dto';
import { SyncRoutineResponseDto } from './dto/sync-routine-response.dto';
import type { MobileRoutineItemDto } from './dto/mobile-routine-item.dto';

const ROUTINE_DAY_KEYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] as const;

const customerSearchSelect = {
  idUser: true,
  userNumber: true,
  email: true,
  birthdate: true,
  status: true,
  editAt: true,
  profile: {
    select: {
      name: true,
      lastName: true,
      phone: true,
      emergencyPhone: true,
      observations: true,
      createdAt: true,
      coach: {
        select: {
          profile: {
            select: {
              name: true,
              lastName: true,
            },
          },
        },
      },
    },
  },
  customerMembership: {
    select: {
      idMembershipType: true,
      status: true,
      endDate: true,
      createdAt: true,
      membershipType: {
        select: { name: true },
      },
    },
  },
} as const satisfies Prisma.UserSelect;

const deletedCustomerSelect = {
  idUser: true,
  userNumber: true,
  email: true,
  status: true,
  editAt: true,
  profile: {
    select: {
      name: true,
      lastName: true,
      phone: true,
      emergencyPhone: true,
      observations: true,
      createdAt: true,
      coach: {
        select: {
          profile: {
            select: {
              name: true,
              lastName: true,
            },
          },
        },
      },
    },
  },
  customerMembership: {
    select: {
      idMembershipType: true,
      status: true,
      membershipType: {
        select: { name: true },
      },
    },
  },
  deletedBy: {
    select: {
      profile: {
        select: {
          name: true,
          lastName: true,
        },
      },
    },
  },
} as const satisfies Prisma.UserSelect;

/** CustomerBan-centric select for banned-customers list (audit history). */
const bannedBanSelect = {
  idBan: true,
  createdAt: true,
  reason: true,
  status: true,
  customer: {
    select: {
      idUser: true,
      userNumber: true,
      email: true,
      profile: {
        select: {
          name: true,
          lastName: true,
          phone: true,
        },
      },
      customerMembership: {
        select: {
          idMembershipType: true,
        },
      },
    },
  },
  coach: {
    select: {
      profile: {
        select: {
          name: true,
          lastName: true,
        },
      },
    },
  },
} as const satisfies Prisma.CustomerBanSelect;

const customerBanHistorySelect = {
  idBan: true,
  createdAt: true,
  reason: true,
  status: true,
  liftedAt: true,
  liftReason: true,
  coach: {
    select: {
      profile: {
        select: {
          name: true,
          lastName: true,
        },
      },
    },
  },
  liftedBy: {
    select: {
      profile: {
        select: {
          name: true,
          lastName: true,
        },
      },
    },
  },
} as const satisfies Prisma.CustomerBanSelect;

@Injectable()
export class CustomersService {
  constructor(
    private readonly sharedUsers: SharedUsersService,
    private readonly prisma: PrismaService,
    private readonly membershipAuditService: MembershipAuditService,
    private readonly authService: AuthService,
    private readonly routineHydrationService: RoutineHydrationService,
  ) {}

  /**
   * Mobile-friendly customer login using email or global `userNumber` without a password prompt.
   * Security note: Prefer pairing this with MFA, device pinning, or a second factor before production rollout.
   */
  async loginCustomer(dto: LoginCustomerDto): Promise<MobileCustomerLoginResponseDto> {
    const identifier = dto.identifier.trim();
    if (!identifier.length) {
      throw new UnauthorizedException('AUTH.ERRORS.INVALID_CREDENTIALS');
    }

    const customerUser = await this.resolveActiveCustomerByIdentifier(identifier);
    await this.authService.assertMobileCustomerEligible(customerUser);

    const routineRowsPromise = this.prisma.routine.findMany({
      where: {
        idAccount: customerUser.idAccount,
        idUser: customerUser.idUser,
        status: GenericStatus.active,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        idRoutine: true,
        editedAt: true,
        data: true,
      },
    });

    const [accessToken, routineRows] = await Promise.all([
      this.authService.signAccessTokenForUserId(customerUser.idUser),
      routineRowsPromise,
    ]);

    const routineData: MobileRoutineItemDto[] | null =
      routineRows.length === 0
        ? null
        : await buildMobileRoutineItems(this.routineHydrationService, routineRows);

    const membershipAvailable = await accountRequiresCustomerMembership(
      this.prisma,
      customerUser.idAccount,
      customerUser.account.type,
    );

    return {
      accessToken,
      customer: {
        name: CustomersService.customerDisplayName(customerUser.profile),
        userNumber: customerUser.userNumber,
        email: obfuscateEmailForMobile(customerUser.email),
        routineData,
        ...(membershipAvailable ? { membershipAvailable: true } : {}),
      },
    };
  }

  /**
   * Compares the server routine revision with the client's last-known edited_at.
   * Returns hydrated routine payload when the server copy is newer.
   */
  async syncRoutine(
    idAccount: number,
    idUser: number,
    dto: SyncRoutineDto,
  ): Promise<SyncRoutineResponseDto> {
    const routine = await this.prisma.routine.findFirst({
      where: {
        idRoutine: dto.id_routine,
        idAccount,
        idUser,
        status: GenericStatus.active,
      },
    });

    if (!routine) {
      throw new NotFoundException('ROUTINES.ERRORS.NOT_FOUND');
    }

    const clientEditedAt = new Date(dto.client_edited_at);
    if (Number.isNaN(clientEditedAt.getTime())) {
      throw new BadRequestException('CUSTOMERS.ERRORS.INVALID_CLIENT_EDITED_AT');
    }

    // Fallback to 0 if editedAt is null for older legacy routines
    const serverEditedAtMs = routine.editedAt ? routine.editedAt.getTime() : 0;
    const clientEditedAtMs = clientEditedAt.getTime();

    if (serverEditedAtMs <= clientEditedAtMs) {
      return { isUpToDate: true };
    }

    const [hydratedRoutine] = await buildMobileRoutineItems(
      this.routineHydrationService,
      [routine],
    );

    return {
      isUpToDate: false,
      routine: hydratedRoutine,
    };
  }

  async findAll(
    id_account: number,
    page = 1,
    limit = 50,
    search = '',
    listFilters?: CustomerListFilters,
  ): Promise<{ data: CustomerResponseDto[]; total: number }> {
    const take = Math.max(Number(limit) || 50, 1);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    const usesMembershipManagedStatus =
      await accountUsesMembershipManagedCustomerStatus(this.prisma, id_account);
    const where = this.buildCustomerWhere(
      id_account,
      search,
      listFilters,
      usesMembershipManagedStatus,
    );

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: customerSearchSelect,
        orderBy: { idUser: 'asc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    const activeRoutineCounts = await this.countActiveRoutineDaysByUser(
      id_account,
      rows.map((row) => row.idUser),
    );

    return {
      data: rows.map((row) =>
        toCustomerResponseDto(
          {
            ...(row as CustomerSource),
            activeRoutinesCount: activeRoutineCounts.get(row.idUser) ?? 0,
          },
          { usesMembershipManagedStatus },
        ),
      ),
      total,
    };
  }

  async findOne(
    id_user: number,
    id_account: number,
  ): Promise<CustomerResponseDto> {
    const row = await this.findCustomerRowForResponse(id_user, id_account);
    if (!row) {
      throw new NotFoundException('Customer not found');
    }
    return this.mapToCustomerResponseDto(id_account, row as CustomerSource);
  }

  async searchCustomers(
    query: string,
    accountId: number,
    page = 1,
    limit = 50,
    listFilters?: CustomerListFilters,
  ): Promise<{ data: CustomerResponseDto[]; total: number }> {
    return this.findAll(accountId, page, limit, query, listFilters);
  }

  /** Map validated query DTO to normalized list filters. */
  static toListFilters(dto: ListCustomersQueryDto): CustomerListFilters | undefined {
    return CustomersService.parseListFilterDto(dto);
  }

  private static parseListFilterDto(
    dto: ListCustomersQueryDto,
  ): CustomerListFilters | undefined {
    const hasStatus = dto.status != null;
    const hasMembership =
      dto.membershipId != null && Number.isFinite(Number(dto.membershipId));
    const rawCoach = dto.coachId != null ? dto.coachId.trim() : '';
    const hasCoach = rawCoach.length > 0;
    if (!hasStatus && !hasMembership && !hasCoach) {
      return undefined;
    }
    const out: CustomerListFilters = {};
    if (hasStatus && (dto.status === 'ACTIVE' || dto.status === 'INACTIVE')) {
      out.status = dto.status;
    }
    if (hasMembership) {
      out.membershipId = Math.floor(dto.membershipId as number);
    }
    if (hasCoach) {
      if (rawCoach === 'UNASSIGNED') {
        out.coachId = 'UNASSIGNED';
      } else {
        const n = Number(rawCoach);
        if (!Number.isInteger(n) || n < 1) {
          throw new BadRequestException('CUSTOMERS.ERRORS.INVALID_LIST_FILTERS');
        }
        out.coachId = n;
      }
    }
    return out;
  }

  async update(
    id_user: number,
    id_account: number,
    dto: UpdateUserDto,
  ): Promise<CustomerResponseDto> {
    const updated = await this.sharedUsers.updateUser(
      id_user,
      id_account,
      UserRole.customer,
      dto,
    );
    if (!updated) {
      throw new NotFoundException('Customer not found');
    }
    const row = await this.findCustomerRowForResponse(id_user, id_account);
    if (!row) {
      throw new NotFoundException('Customer not found');
    }
    return this.mapToCustomerResponseDto(id_account, row as CustomerSource);
  }

  async remove(id_user: number, id_account: number, actor_user_id: number) {
    const ok = await this.sharedUsers.softDeleteUser(
      id_user,
      id_account,
      UserRole.customer,
      actor_user_id,
    );
    if (!ok) {
      throw new NotFoundException('Customer not found');
    }
    return { deleted: true };
  }

  async findDeleted(
    id_account: number,
    page = 1,
    limit = 50,
    search = '',
    membershipTypeId?: number,
  ): Promise<{ data: DeletedCustomerResponseDto[]; total: number }> {
    const take = Math.max(Number(limit) || 50, 1);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    const where = this.buildDeletedCustomerWhere(
      id_account,
      search,
      membershipTypeId,
    );

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: deletedCustomerSelect,
        orderBy: { editAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: rows.map((row) =>
        toDeletedCustomerResponseDto(row as DeletedCustomerSource),
      ),
      total,
    };
  }

  async findBanned(
    id_account: number,
    page = 1,
    limit = 50,
    search = '',
  ): Promise<{ data: BannedCustomerResponseDto[]; total: number }> {
    const take = Math.max(Number(limit) || 50, 1);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    const where = this.buildBannedBanWhere(id_account, search);

    const [rows, total] = await Promise.all([
      this.prisma.customerBan.findMany({
        where,
        select: bannedBanSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.customerBan.count({ where }),
    ]);

    return {
      data: rows.map((row) =>
        toBannedCustomerResponseDto(row as BannedBanRowSource),
      ),
      total,
    };
  }

  async getCustomerBanHistory(
    id_user: number,
    id_account: number,
  ): Promise<CustomerBanHistoryEntryDto[]> {
    const customer = await this.prisma.user.findFirst({
      where: {
        idUser: id_user,
        idAccount: id_account,
        role: UserRole.customer,
      },
      select: { idUser: true },
    });
    if (!customer) {
      throw new NotFoundException('CUSTOMERS.ERRORS.CUSTOMER_NOT_FOUND');
    }

    const rows = await this.prisma.customerBan.findMany({
      where: {
        idCustomer: id_user,
        idAccount: id_account,
      },
      select: customerBanHistorySelect,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) =>
      toCustomerBanHistoryEntryDto(row as CustomerBanHistoryRow),
    );
  }

  async banCustomer(
    id_user: number,
    id_account: number,
    actor_id: number,
    dto: BanCustomerDto,
  ): Promise<CustomerResponseDto> {
    const existing = await this.prisma.user.findFirst({
      where: {
        idUser: id_user,
        idAccount: id_account,
        role: UserRole.customer,
      },
    });

    if (!existing) {
      throw new NotFoundException('CUSTOMERS.ERRORS.CUSTOMER_NOT_FOUND');
    }

    if (existing.status === GenericStatus.deleted) {
      throw new BadRequestException('CUSTOMERS.ERRORS.CUSTOMER_INVALID_STATE');
    }

    if (existing.status === GenericStatus.banned) {
      throw new ConflictException('CUSTOMERS.ERRORS.ALREADY_BANNED');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { idUser: id_user },
        data: { status: GenericStatus.banned },
      });
      const prof = await tx.profile.findUnique({
        where: { idUser: id_user },
      });
      if (prof) {
        await tx.profile.update({
          where: { idUser: id_user },
          data: { status: GenericStatus.banned },
        });
      }
      await tx.customerBan.create({
        data: {
          idAccount: id_account,
          idCustomer: id_user,
          idCoach: actor_id,
          reason: dto.reason.trim(),
          status: BanStatus.ACTIVE,
        },
      });
    });

    const row = await this.findCustomerRowForResponse(id_user, id_account);
    if (!row) {
      throw new NotFoundException('CUSTOMERS.ERRORS.CUSTOMER_NOT_FOUND');
    }
    return this.mapToCustomerResponseDto(id_account, row as CustomerSource);
  }

  async unbanCustomer(
    id_user: number,
    id_account: number,
    actor_id: number,
    dto: UnbanCustomerDto,
  ): Promise<CustomerResponseDto> {
    const liftReason = dto.liftReason.trim();
    try {
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.user.findFirst({
          where: {
            idUser: id_user,
            idAccount: id_account,
            role: UserRole.customer,
          },
        });

        if (!existing) {
          throw new NotFoundException('CUSTOMERS.ERRORS.CUSTOMER_NOT_FOUND');
        }

        if (existing.status !== GenericStatus.banned) {
          throw new BadRequestException('CUSTOMERS.ERRORS.NOT_BANNED');
        }

        const activeBan = await tx.customerBan.findFirst({
          where: {
            idCustomer: id_user,
            idAccount: id_account,
            status: BanStatus.ACTIVE,
          },
        });

        if (!activeBan) {
          throw new NotFoundException('CUSTOMERS.ERRORS.NO_ACTIVE_BAN');
        }

        await tx.customerBan.update({
          where: { idBan: activeBan.idBan },
          data: {
            status: BanStatus.INACTIVE,
            liftedAt: new Date(),
            liftedById: actor_id,
            liftReason,
          },
        });

        await this.applyRecoverCustomerDtoInTransaction(
          tx,
          id_user,
          id_account,
          dto,
        );
      });
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) {
        throw e;
      }
      if (
        e instanceof PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException(
          'CUSTOMERS.RECOVER.ERRORS.MEMBERSHIP_ASSIGN_INVALID',
        );
      }
      throw e;
    }

    const row = await this.findCustomerRowForResponse(id_user, id_account);
    if (!row) {
      throw new NotFoundException('CUSTOMERS.ERRORS.CUSTOMER_NOT_FOUND');
    }
    return this.mapToCustomerResponseDto(id_account, row as CustomerSource);
  }

  async recoverCustomer(
    id_user: number,
    id_account: number,
    dto: RecoverCustomerDto,
  ): Promise<CustomerResponseDto> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findFirst({
          where: {
            idUser: id_user,
            idAccount: id_account,
            role: UserRole.customer,
            status: GenericStatus.deleted,
          },
        });
        if (!user) {
          throw new NotFoundException(
            'CUSTOMERS.ERRORS.DELETED_CUSTOMER_NOT_FOUND',
          );
        }

        await this.applyRecoverCustomerDtoInTransaction(
          tx,
          id_user,
          id_account,
          dto,
        );
      });
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) {
        throw e;
      }
      if (
        e instanceof PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException(
          'CUSTOMERS.RECOVER.ERRORS.MEMBERSHIP_ASSIGN_INVALID',
        );
      }
      throw e;
    }

    const row = await this.findCustomerRowForResponse(id_user, id_account);
    if (!row) {
      throw new NotFoundException('CUSTOMERS.ERRORS.CUSTOMER_NOT_FOUND');
    }
    return this.mapToCustomerResponseDto(id_account, row as CustomerSource);
  }

  /** Shared RESTORE / ACTIVE / INACTIVE membership recovery (deleted-customer recover + lift-ban). */
  private async applyRecoverCustomerDtoInTransaction(
    tx: Prisma.TransactionClient,
    id_user: number,
    id_account: number,
    dto: RecoverCustomerDto,
  ): Promise<void> {
    if (dto.recoveryType === CustomerRecoveryTypeDto.INACTIVE) {
      await tx.user.update({
        where: { idUser: id_user },
        data: { status: GenericStatus.inactive },
      });
      const prof = await tx.profile.findUnique({
        where: { idUser: id_user },
      });
      if (prof) {
        await tx.profile.update({
          where: { idUser: id_user },
          data: { status: GenericStatus.inactive },
        });
      }
      const membership = await tx.customerMembership.findUnique({
        where: { idUser: id_user },
      });
      if (membership) {
        await tx.customerMembership.update({
          where: { idUser: id_user },
          data: { status: GenericStatus.inactive },
        });
        const { startDate: adStart, endDate: adEnd } = membershipRowDatesToAudit(
          new Date(membership.startDate),
          membership.endDate != null ? new Date(membership.endDate) : null,
        );
        const mid = membership.idCustomerMembership;
        await this.membershipAuditService.logMovement(
          {
            idAccount: id_account,
            idUser: id_user,
            idNewMembership: mid,
            idOldMembership: mid,
            actionType: MembershipAction.CANCELLATION,
            startDate: adStart,
            endDate: adEnd,
          },
          tx,
        );
      }
      return;
    }

    if (dto.recoveryType === CustomerRecoveryTypeDto.RESTORE) {
      await tx.user.update({
        where: { idUser: id_user },
        data: { status: GenericStatus.active },
      });
      const profRestore = await tx.profile.findUnique({
        where: { idUser: id_user },
      });
      if (profRestore) {
        await tx.profile.update({
          where: { idUser: id_user },
          data: { status: GenericStatus.active },
        });
      }
      const existingMembership = await tx.customerMembership.findUnique({
        where: { idUser: id_user },
      });
      if (!existingMembership) {
        throw new BadRequestException(
          'CUSTOMERS.RECOVER.ERRORS.NO_MEMBERSHIP_TO_RESTORE',
        );
      }
      await tx.customerMembership.update({
        where: { idUser: id_user },
        data: { status: GenericStatus.active },
      });
      const { startDate: adStart, endDate: adEnd } = membershipRowDatesToAudit(
        new Date(existingMembership.startDate),
        existingMembership.endDate != null
          ? new Date(existingMembership.endDate)
          : null,
      );
      const mid = existingMembership.idCustomerMembership;
      await this.membershipAuditService.logMovement(
        {
          idAccount: id_account,
          idUser: id_user,
          idNewMembership: mid,
          idOldMembership: mid,
          actionType: MembershipAction.RENEWAL,
          startDate: adStart,
          endDate: adEnd,
        },
        tx,
      );
      return;
    }

    if (dto.recoveryType === CustomerRecoveryTypeDto.ACTIVE) {
      const hasMembershipId =
        dto.membershipId !== undefined &&
        dto.membershipId !== null &&
        Number.isFinite(Number(dto.membershipId));

      if (!hasMembershipId) {
        throw new BadRequestException(
          'CUSTOMERS.RECOVER.ERRORS.MEMBERSHIP_REQUIRED',
        );
      }

      await tx.user.update({
        where: { idUser: id_user },
        data: { status: GenericStatus.active },
      });
      const profActive = await tx.profile.findUnique({
        where: { idUser: id_user },
      });
      if (profActive) {
        await tx.profile.update({
          where: { idUser: id_user },
          data: { status: GenericStatus.active },
        });
      }

      const membershipType = await tx.membershipType.findFirst({
        where: {
          idAccount: id_account,
          idMembershipType: dto.membershipId!,
          status: { not: GenericStatus.deleted },
        },
      });
      if (!membershipType) {
        throw new NotFoundException(
          'CUSTOMERS.RECOVER.ERRORS.MEMBERSHIP_TYPE_NOT_FOUND',
        );
      }

      const startDate = startOfUtcDay(new Date());
      const endDate = addUtcDays(startDate, membershipType.durationDays);
      const now = new Date();

      const priorMembership = await tx.customerMembership.findUnique({
        where: { idUser: id_user },
      });

      await tx.customerMembership.upsert({
        where: { idUser: id_user },
        create: {
          idAccount: id_account,
          idUser: id_user,
          idMembershipType: dto.membershipId!,
          startDate,
          endDate,
          status: GenericStatus.active,
          createdAt: now,
        },
        update: {
          idAccount: id_account,
          idMembershipType: dto.membershipId!,
          startDate,
          endDate,
          status: GenericStatus.active,
        },
      });

      const nextMembership = await tx.customerMembership.findUnique({
        where: { idUser: id_user },
        select: {
          idCustomerMembership: true,
          startDate: true,
          endDate: true,
          idMembershipType: true,
          status: true,
        },
      });
      if (!nextMembership) {
        return;
      }

      const actionType = !priorMembership
        ? MembershipAction.NEW
        : priorMembership.status === GenericStatus.active
          ? MembershipAction.RENEWAL
          : MembershipAction.CHANGE;

      const { startDate: adStart, endDate: adEnd } = membershipRowDatesToAudit(
        new Date(nextMembership.startDate),
        nextMembership.endDate != null ? new Date(nextMembership.endDate) : null,
      );

      await this.membershipAuditService.logMovement(
        {
          idAccount: id_account,
          idUser: id_user,
          idNewMembership: nextMembership.idCustomerMembership,
            idOldMembership:
              actionType === MembershipAction.NEW
                ? null
                : priorMembership!.idCustomerMembership,
          actionType,
          startDate: adStart,
          endDate: adEnd,
        },
        tx,
      );
      return;
    }

    throw new BadRequestException(
      'CUSTOMERS.RECOVER.ERRORS.INVALID_RECOVERY_TYPE',
    );
  }

  private buildDeletedCustomerWhere(
    idAccount: number,
    search: string,
    membershipTypeId?: number,
  ): Prisma.UserWhereInput {
    const normalizedQuery = search.trim();

    return {
      idAccount,
      role: UserRole.customer,
      status: GenericStatus.deleted,
      ...(membershipTypeId !== undefined
        ? {
            customerMembership: {
              is: {
                idAccount,
                idMembershipType: membershipTypeId,
              },
            },
          }
        : {}),
      ...(normalizedQuery
        ? {
            OR: [
              {
                email: {
                  contains: normalizedQuery,
                  mode: 'insensitive',
                },
              },
              {
                profile: {
                  is: {
                    name: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                profile: {
                  is: {
                    lastName: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                profile: {
                  is: {
                    phone: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
  }

  private async findCustomerRowForResponse(
    id_user: number,
    id_account: number,
  ) {
    return this.prisma.user.findFirst({
      where: {
        idUser: id_user,
        idAccount: id_account,
        role: UserRole.customer,
        status: { not: GenericStatus.deleted },
      },
      select: customerSearchSelect,
    });
  }

  private async countActiveRoutineDaysByUser(
    idAccount: number,
    userIds: number[],
  ): Promise<Map<number, number>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const routines = await this.prisma.routine.findMany({
      where: {
        idAccount,
        idUser: { in: userIds },
        status: GenericStatus.active,
      },
      select: {
        idUser: true,
        data: true,
      },
    });

    const counts = new Map<number, number>();
    for (const routine of routines) {
      const routineDays = this.countPopulatedRoutineDays(routine.data);
      counts.set(routine.idUser, (counts.get(routine.idUser) ?? 0) + routineDays);
    }
    return counts;
  }

  private countPopulatedRoutineDays(data: Prisma.JsonValue): number {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return 0;
    }
    const weekData = data as Record<string, unknown>;
    return ROUTINE_DAY_KEYS.filter((dayKey) => {
      const value = weekData[dayKey];
      return Array.isArray(value) && value.length > 0;
    }).length;
  }

  private async mapToCustomerResponseDto(
    id_account: number,
    row: CustomerSource,
    usesMembershipManagedStatus?: boolean,
  ): Promise<CustomerResponseDto> {
    const usesManaged =
      usesMembershipManagedStatus ??
      (await accountUsesMembershipManagedCustomerStatus(
        this.prisma,
        id_account,
      ));
    return toCustomerResponseDto(row, {
      usesMembershipManagedStatus: usesManaged,
    });
  }

  private buildCustomerWhere(
    idAccount: number,
    search: string,
    filters?: CustomerListFilters,
    usesMembershipManagedStatus = false,
    todayStart: Date = startOfUtcDay(new Date()),
  ): Prisma.UserWhereInput {
    const normalizedQuery = search.trim();

    let statusWhere: Prisma.UserWhereInput;
    if (usesMembershipManagedStatus) {
      if (filters?.status === 'ACTIVE') {
        statusWhere = buildMembershipManagedActiveCustomerWhere(todayStart);
      } else if (filters?.status === 'INACTIVE') {
        statusWhere = buildMembershipManagedInactiveCustomerWhere(todayStart);
      } else {
        statusWhere = {
          status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
        };
      }
    } else {
      const statusFilter: Prisma.UserWhereInput['status'] =
        filters?.status === 'ACTIVE'
          ? GenericStatus.active
          : filters?.status === 'INACTIVE'
            ? GenericStatus.inactive
            : { notIn: [GenericStatus.deleted, GenericStatus.banned] };
      statusWhere = { status: statusFilter };
    }

    return {
      idAccount,
      role: UserRole.customer,
      ...statusWhere,
      ...(filters?.coachId === 'UNASSIGNED'
        ? { profile: { is: { idCoach: null } } }
        : typeof filters?.coachId === 'number'
          ? { profile: { is: { idCoach: filters.coachId } } }
          : {}),
      ...(filters?.membershipId != null
        ? {
            customerMembership: {
              is: {
                idAccount,
                idMembershipType: filters.membershipId,
              },
            },
          }
        : {}),
      ...(normalizedQuery
        ? {
            OR: [
              {
                email: {
                  contains: normalizedQuery,
                  mode: 'insensitive',
                },
              },
              {
                profile: {
                  is: {
                    name: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                profile: {
                  is: {
                    lastName: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                profile: {
                  is: {
                    phone: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
  }

  private buildBannedBanWhere(
    idAccount: number,
    search: string,
  ): Prisma.CustomerBanWhereInput {
    const normalizedQuery = search.trim();

    return {
      idAccount,
      ...(normalizedQuery
        ? {
            OR: [
              {
                customer: {
                  email: {
                    contains: normalizedQuery,
                    mode: 'insensitive',
                  },
                },
              },
              {
                customer: {
                  profile: {
                    is: {
                      name: {
                        contains: normalizedQuery,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
              {
                customer: {
                  profile: {
                    is: {
                      lastName: {
                        contains: normalizedQuery,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
              {
                customer: {
                  profile: {
                    is: {
                      phone: {
                        contains: normalizedQuery,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
  }

  /**
   * Dashboard KPIs scoped to the tenant account (owner/coach/solo_coach only at controller).
   * Membership- and access-only Prisma work is skipped when RBAC + feature flags deny the slice
   * (`null` in the payload for skipped fields).
   */
  async getDashboardMetrics(
    user: JwtPayload,
    trendView: { year: number; half: DashboardSignUpHalf },
    fullYearTrendYear: number,
    accessDayTimeZone: string,
  ): Promise<{
    active_members_count: number;
    new_customers_last_30_days: number;
    renewals_last_30_days: number | null;
    attendances_today: number | null;
    access_crowdmeter_today: number[] | null;
    renewals_trend: { month_start: string; count: number }[] | null;
    sign_up_trend_full_year: { month_start: string; count: number }[];
    membership_distribution: { name: string; value: number }[] | null;
    expiring_soon: { name: string; days_until_end: number }[] | null;
    inactive_customers: { name: string; chip_status: 'deleted' | 'banned' | 'expired' }[];
    birthdays_this_month: { name: string; birthdate: string; is_today: boolean }[];
    cancellation_rate_percent: number | null;
    loyalty_ranking: { name: string; description: string }[] | null;
    risky_customers:
      | {
          name: string;
          description_key: string;
          description_params?: { days: number };
        }[]
      | null;
  }> {
    const idAccount = user.id_account;
    const today = startOfUtcDay(new Date());
    const profileCreatedSince = subUtcDays(today, 30);
    const accessDayRange = getZonedCalendarDayRangeUtc(new Date(), accessDayTimeZone);

    const enabledFeatureIds = await this.getActiveFeatureIdsForUser(user.sub);
    const gates = evaluateDashboardMetricsGates(user.role, enabledFeatureIds);

    const basePromise = Promise.all([
      this.prisma.user.count({
        where: this.buildActiveMembershipCustomerWhere(idAccount, today),
      }),
      this.prisma.user.count({
        where: {
          idAccount,
          role: UserRole.customer,
          profile: {
            is: {
              createdAt: { gte: profileCreatedSince },
            },
          },
        },
      }),
      this.computeSignUpTrendForCalendarYear(idAccount, fullYearTrendYear),
      this.computeInactiveDashboardCustomers(idAccount, today),
      this.computeBirthdaysThisMonth(idAccount, today),
    ]);

    const membershipPromise = gates.canViewMemberships
      ? Promise.all([
          this.countRenewalsSince(idAccount, profileCreatedSince),
          this.computeRenewalsTrendForHalf(idAccount, trendView.year, trendView.half),
          this.computeMembershipDistributionByPlan(idAccount, today),
          this.computeExpiringSoonMemberships(idAccount, today),
          this.computeCancellationRatePercent(idAccount, today),
          this.computeLoyaltyRanking(idAccount),
        ])
      : Promise.resolve(null);

    const accessPromise = gates.canViewAccess
      ? Promise.all([
          this.prisma.entryLog.count({
            where: {
              idAccount,
              status: GenericStatus.active,
              entryDate: {
                gte: accessDayRange.start,
                lt: accessDayRange.endExclusive,
              },
            },
          }),
          this.computeAccessCrowdmeterTodayBuckets(
            idAccount,
            accessDayRange.start,
            accessDayRange.endExclusive,
            accessDayTimeZone,
          ),
          this.computeRiskyDashboardCustomers(idAccount, today),
        ])
      : Promise.resolve(null);

    const [
      [active_members_count, new_customers_last_30_days, sign_up_trend_full_year, inactive_customers, birthdays_this_month],
      membershipSlice,
      accessSlice,
    ] = await Promise.all([basePromise, membershipPromise, accessPromise]);

    let renewals_last_30_days: number | null = null;
    let renewals_trend: { month_start: string; count: number }[] | null = null;
    let membership_distribution: { name: string; value: number }[] | null = null;
    let expiring_soon: { name: string; days_until_end: number }[] | null = null;
    let cancellation_rate_percent: number | null = null;
    let loyalty_ranking: { name: string; description: string }[] | null = null;

    if (membershipSlice) {
      const [r30, rt, md, es, cr, lr] = membershipSlice;
      renewals_last_30_days = r30;
      renewals_trend = rt;
      membership_distribution = md;
      expiring_soon = es;
      cancellation_rate_percent = cr;
      loyalty_ranking = lr;
    }

    let attendances_today: number | null = null;
    let access_crowdmeter_today: number[] | null = null;
    let risky_customers:
      | {
          name: string;
          description_key: string;
          description_params?: { days: number };
        }[]
      | null = null;

    if (accessSlice) {
      const [at, cm, risky] = accessSlice;
      attendances_today = at;
      access_crowdmeter_today = cm;
      risky_customers = risky;
    }

    return {
      active_members_count,
      new_customers_last_30_days,
      renewals_last_30_days,
      attendances_today,
      access_crowdmeter_today,
      renewals_trend,
      sign_up_trend_full_year,
      membership_distribution,
      expiring_soon,
      inactive_customers,
      birthdays_this_month,
      cancellation_rate_percent,
      loyalty_ranking,
      risky_customers,
    };
  }

  /**
   * Solo coach dashboard: owner-like business metrics without access/kiosk data.
   * `memberships` is null unless the actor has feature 5006 active on their own flags.
   */
  async getSoloCoachDashboardMetrics(
    user: JwtPayload,
    trendView: { year: number; half: DashboardSignUpHalf },
    fullYearTrendYear: number,
  ): Promise<{
    active_members_count: number;
    new_customers_last_30_days: number;
    sign_up_trend_full_year: { month_start: string; count: number }[];
    inactive_customers: { name: string; chip_status: 'deleted' | 'banned' | 'expired' }[];
    birthdays_this_month: { name: string; birthdate: string; is_today: boolean }[];
    memberships: {
      renewals_last_30_days: number;
      renewals_trend: { month_start: string; count: number }[];
      membership_distribution: { name: string; value: number }[];
      expiring_soon: { name: string; days_until_end: number }[];
      cancellation_rate_percent: number;
      loyalty_ranking: { name: string; description: string }[];
    } | null;
  }> {
    const idAccount = user.id_account;
    const today = startOfUtcDay(new Date());
    const profileCreatedSince = subUtcDays(today, 30);
    const enabledFeatureIds = await this.getActiveFeatureIdsForUser(user.sub);
    const hasMembershipFeature = enabledFeatureIds.includes(
      DASHBOARD_FEATURE_MEMBERSHIP_MANAGEMENT,
    );

    const activeCustomerWhere = hasMembershipFeature
      ? this.buildActiveMembershipCustomerWhere(idAccount, today)
      : this.buildSoloCoachAccountActiveCustomerWhere(idAccount);

    const [
      active_members_count,
      new_customers_last_30_days,
      sign_up_trend_full_year,
      inactive_customers,
      birthdays_this_month,
      membershipSlice,
    ] = await Promise.all([
      this.prisma.user.count({
        where: activeCustomerWhere,
      }),
      this.prisma.user.count({
        where: {
          idAccount,
          role: UserRole.customer,
          profile: {
            is: {
              createdAt: { gte: profileCreatedSince },
            },
          },
        },
      }),
      this.computeSignUpTrendForCalendarYear(idAccount, fullYearTrendYear),
      hasMembershipFeature
        ? this.computeInactiveDashboardCustomers(idAccount, today)
        : this.computeSoloCoachInactiveCustomersProfileOnly(idAccount),
      hasMembershipFeature
        ? this.computeBirthdaysThisMonth(idAccount, today)
        : this.computeSoloCoachBirthdaysThisMonth(idAccount),
      hasMembershipFeature
        ? Promise.all([
            this.countRenewalsSince(idAccount, profileCreatedSince),
            this.computeRenewalsTrendForHalf(idAccount, trendView.year, trendView.half),
            this.computeMembershipDistributionByPlan(idAccount, today),
            this.computeExpiringSoonMemberships(idAccount, today),
            this.computeCancellationRatePercent(idAccount, today),
            this.computeLoyaltyRanking(idAccount),
          ])
        : Promise.resolve(null),
    ]);

    let memberships: {
      renewals_last_30_days: number;
      renewals_trend: { month_start: string; count: number }[];
      membership_distribution: { name: string; value: number }[];
      expiring_soon: { name: string; days_until_end: number }[];
      cancellation_rate_percent: number;
      loyalty_ranking: { name: string; description: string }[];
    } | null = null;

    if (membershipSlice) {
      const [renewals_last_30_days, renewals_trend, membership_distribution, expiring_soon, cancellation_rate_percent, loyalty_ranking] =
        membershipSlice;
      memberships = {
        renewals_last_30_days,
        renewals_trend,
        membership_distribution,
        expiring_soon,
        cancellation_rate_percent,
        loyalty_ranking,
      };
    }

    return {
      active_members_count,
      new_customers_last_30_days,
      sign_up_trend_full_year,
      inactive_customers,
      birthdays_this_month,
      memberships,
    };
  }

  /**
   * Coach dashboard KPIs: account-wide metrics for the coach's tenant (`id_account`).
   * `attendances_today` and `access_crowdmeter_today` are null unless the account owner has feature 5001 active.
   */
  async getCoachDashboardMetrics(
    user: JwtPayload,
    accessDayTimeZone: string,
  ): Promise<{
    active_members_count: number;
    birthdays_this_month: { name: string; birthdate: string; is_today: boolean }[];
    renewals_last_30_days: number;
    expiring_soon: { name: string; days_until_end: number }[];
    attendances_today: number | null;
    access_crowdmeter_today: number[] | null;
    risky_customers:
      | {
          name: string;
          description_key: string;
          description_params?: { days: number };
        }[]
      | null;
  }> {
    const idAccount = user.id_account;
    const today = startOfUtcDay(new Date());
    const profileCreatedSince = subUtcDays(today, 30);
    const accessDayRange = getZonedCalendarDayRangeUtc(new Date(), accessDayTimeZone);
    const ownerHasEntryLogsFeature = await this.accountOwnerHasActiveFeature(
      idAccount,
      DASHBOARD_FEATURE_ENTRY_LOGS,
    );

    const standardPromise = Promise.all([
      this.prisma.user.count({
        where: this.buildActiveMembershipCustomerWhere(idAccount, today),
      }),
      this.computeBirthdaysThisMonth(idAccount, today),
      this.countRenewalsSince(idAccount, profileCreatedSince),
      this.computeExpiringSoonMemberships(idAccount, today),
      this.computeRiskyDashboardCustomers(idAccount, today),
    ]);

    if (!ownerHasEntryLogsFeature) {
      const [
        active_members_count,
        birthdays_this_month,
        renewals_last_30_days,
        expiring_soon,
        risky_customers,
      ] = await standardPromise;
      return {
        active_members_count,
        birthdays_this_month,
        renewals_last_30_days,
        expiring_soon,
        attendances_today: null,
        access_crowdmeter_today: null,
        risky_customers,
      };
    }

    const [
      [
        active_members_count,
        birthdays_this_month,
        renewals_last_30_days,
        expiring_soon,
        risky_customers,
      ],
      [attendances_today, access_crowdmeter_today],
    ] = await Promise.all([
      standardPromise,
      Promise.all([
        this.prisma.entryLog.count({
          where: {
            idAccount,
            status: GenericStatus.active,
            entryDate: {
              gte: accessDayRange.start,
              lt: accessDayRange.endExclusive,
            },
          },
        }),
        this.computeAccessCrowdmeterTodayBuckets(
          idAccount,
          accessDayRange.start,
          accessDayRange.endExclusive,
          accessDayTimeZone,
        ),
      ]),
    ]);

    return {
      active_members_count,
      birthdays_this_month,
      renewals_last_30_days,
      expiring_soon,
      attendances_today,
      access_crowdmeter_today,
      risky_customers,
    };
  }

  /** Used by `GET /dashboard/renewal-trend` to avoid renewal queries when the caller cannot view membership metrics. */
  async canUserViewDashboardMembershipMetrics(user: JwtPayload): Promise<boolean> {
    const ids = await this.getActiveFeatureIdsForUser(user.sub);
    return evaluateDashboardMetricsGates(user.role, ids).canViewMemberships;
  }

  private async getActiveFeatureIdsForUser(idUser: number): Promise<number[]> {
    const rows = await this.prisma.featureFlag.findMany({
      where: {
        idUser,
        status: GenericStatus.active,
        feature: { status: GenericStatus.active },
      },
      select: { idFeature: true },
    });
    return rows.map((r) => r.idFeature);
  }

  /** Whether the account's owner user has an active feature flag for `idFeature`. */
  private async accountOwnerHasActiveFeature(
    idAccount: number,
    idFeature: number,
  ): Promise<boolean> {
    const owner = await this.prisma.user.findFirst({
      where: {
        idAccount,
        role: UserRole.owner,
        status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
      },
      select: { idUser: true },
      orderBy: { idUser: 'asc' },
    });
    if (!owner) {
      return false;
    }
    const enabledFeatureIds = await this.getActiveFeatureIdsForUser(owner.idUser);
    return enabledFeatureIds.includes(idFeature);
  }

  /**
   * Entry logs in [dayStartUtc, dayEndExclusiveUtc) (aligned with `attendances_today`), grouped into
   * 12 two-hour buckets using the wall-clock hour in `accessDayTimeZone` and Math.floor(hour / 2) * 2.
   */
  private async computeAccessCrowdmeterTodayBuckets(
    idAccount: number,
    dayStartUtc: Date,
    dayEndExclusiveUtc: Date,
    accessDayTimeZone: string,
  ): Promise<number[]> {
    const buckets = new Array<number>(12).fill(0);

    const logs = await this.prisma.entryLog.findMany({
      where: {
        idAccount,
        status: GenericStatus.active,
        entryDate: {
          gte: dayStartUtc,
          lt: dayEndExclusiveUtc,
        },
      },
      select: { entryDate: true },
    });

    for (const row of logs) {
      const d = row.entryDate;
      const localHour = getLocalHourInZone(d, accessDayTimeZone);
      const bucketHour = Math.floor(localHour / 2) * 2;
      const index = bucketHour / 2;
      if (index >= 0 && index < 12) {
        buckets[index] += 1;
      }
    }

    return buckets;
  }

  private buildActiveMembershipCustomerWhere(
    idAccount: number,
    todayUtcStart: Date,
  ): Prisma.UserWhereInput {
    return {
      idAccount,
      role: UserRole.customer,
      status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
      customerMembership: {
        is: {
          idAccount,
          status: GenericStatus.active,
          OR: [{ endDate: null }, { endDate: { gte: todayUtcStart } }],
        },
      },
    };
  }

  /** Solo coach dashboard only (feature 5006 inactive): all non-deleted/banned customers. */
  private buildSoloCoachAccountActiveCustomerWhere(
    idAccount: number,
  ): Prisma.UserWhereInput {
    return {
      idAccount,
      role: UserRole.customer,
      status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
    };
  }

  /** Solo coach dashboard only (feature 5006 inactive): birthdays for all account customers. */
  private async computeSoloCoachBirthdaysThisMonth(
    idAccount: number,
  ): Promise<{ name: string; birthdate: string; is_today: boolean }[]> {
    const { month: nowMonth, day: nowDay } = this.serverLocalMonthDay();
    const rows = await this.prisma.user.findMany({
      where: {
        ...this.buildSoloCoachAccountActiveCustomerWhere(idAccount),
        birthdate: { not: null },
      },
      select: {
        birthdate: true,
        email: true,
        userNumber: true,
        profile: {
          select: {
            name: true,
            lastName: true,
          },
        },
      },
    });

    const withSort: {
      name: string;
      birthdate: string;
      is_today: boolean;
      sortDay: number;
    }[] = [];

    for (const row of rows) {
      if (!row.birthdate) {
        continue;
      }
      const { month, day } = this.calendarMonthDayFromStoredBirthdate(
        new Date(row.birthdate),
      );
      if (month !== nowMonth) {
        continue;
      }
      withSort.push({
        name: this.formatDashboardListCustomerName({
          email: row.email,
          userNumber: row.userNumber,
          profile: row.profile,
        }),
        birthdate: new Date(row.birthdate).toISOString().slice(0, 10),
        is_today: day === nowDay,
        sortDay: day,
      });
    }

    withSort.sort((a, b) => a.sortDay - b.sortDay);
    return withSort.map(({ name, birthdate, is_today }) => ({
      name,
      birthdate,
      is_today,
    }));
  }

  /**
   * Solo coach dashboard only (feature 5006 inactive): deleted/banned only — no expired membership rows.
   */
  private async computeSoloCoachInactiveCustomersProfileOnly(
    idAccount: number,
  ): Promise<{ name: string; chip_status: 'deleted' | 'banned' | 'expired' }[]> {
    const [deletedRows, bannedRows] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          idAccount,
          role: UserRole.customer,
          status: GenericStatus.deleted,
        },
        select: {
          editAt: true,
          email: true,
          userNumber: true,
          profile: { select: { name: true, lastName: true } },
        },
        orderBy: { editAt: 'desc' },
        take: 6,
      }),
      this.prisma.user.findMany({
        where: {
          idAccount,
          role: UserRole.customer,
          status: GenericStatus.banned,
        },
        select: {
          editAt: true,
          email: true,
          userNumber: true,
          profile: { select: { name: true, lastName: true } },
        },
        orderBy: { editAt: 'desc' },
        take: 6,
      }),
    ]);

    const deletedPool = deletedRows.map((u) => ({
      name: this.formatDashboardListCustomerName({
        email: u.email,
        userNumber: u.userNumber,
        profile: u.profile,
      }),
      chip_status: 'deleted' as const,
      inactiveDate: startOfUtcDay(u.editAt),
    }));

    const bannedPool = bannedRows.map((u) => ({
      name: this.formatDashboardListCustomerName({
        email: u.email,
        userNumber: u.userNumber,
        profile: u.profile,
      }),
      chip_status: 'banned' as const,
      inactiveDate: startOfUtcDay(u.editAt),
    }));

    const merged = [...deletedPool, ...bannedPool]
      .sort((a, b) => b.inactiveDate.getTime() - a.inactiveDate.getTime())
      .slice(0, 6);

    return merged.map(({ name, chip_status }) => ({ name, chip_status }));
  }

  private serverLocalMonthDay(): { month: number; day: number } {
    const n = new Date();
    return { month: n.getMonth(), day: n.getDate() };
  }

  /** Month (0–11) and day from a stored calendar date (PostgreSQL `date`). */
  private calendarMonthDayFromStoredBirthdate(d: Date): { month: number; day: number } {
    const iso = d.toISOString().slice(0, 10);
    const parts = iso.split('-').map(Number);
    return { month: parts[1] - 1, day: parts[2] };
  }

  private async computeBirthdaysThisMonth(
    idAccount: number,
    todayUtcStart: Date,
  ): Promise<{ name: string; birthdate: string; is_today: boolean }[]> {
    const { month: nowMonth, day: nowDay } = this.serverLocalMonthDay();
    const rows = await this.prisma.user.findMany({
      where: {
        ...this.buildActiveMembershipCustomerWhere(idAccount, todayUtcStart),
        birthdate: { not: null },
      },
      select: {
        birthdate: true,
        email: true,
        userNumber: true,
        profile: {
          select: {
            name: true,
            lastName: true,
          },
        },
      },
    });

    const withSort: {
      name: string;
      birthdate: string;
      is_today: boolean;
      sortDay: number;
    }[] = [];

    for (const row of rows) {
      if (!row.birthdate) {
        continue;
      }
      const { month, day } = this.calendarMonthDayFromStoredBirthdate(
        new Date(row.birthdate),
      );
      if (month !== nowMonth) {
        continue;
      }
      withSort.push({
        name: this.formatDashboardListCustomerName({
          email: row.email,
          userNumber: row.userNumber,
          profile: row.profile,
        }),
        birthdate: new Date(row.birthdate).toISOString().slice(0, 10),
        is_today: day === nowDay,
        sortDay: day,
      });
    }

    withSort.sort((a, b) => a.sortDay - b.sortDay);
    return withSort.map(({ name, birthdate, is_today }) => ({
      name,
      birthdate,
      is_today,
    }));
  }

  private addUtcMonths(d: Date, months: number): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  }

  private utcYearMonthKey(d: Date): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  /** Prisma delegate for `MembershipHistory` (typed locally until IDE client matches schema). */
  private membershipHistoryClient() {
    return (this.prisma as unknown as {
      membershipHistory: {
        findMany: (args: {
          where: {
            idAccount: number;
            actionType: unknown;
            createdAt: { gte: Date; lt?: Date };
          };
          select: { createdAt: true };
        }) => Promise<{ createdAt: Date }[]>;
        count: (args: {
          where: {
            idAccount: number;
            actionType: unknown;
            createdAt: { gte: Date };
            user?: Prisma.UserWhereInput;
          };
        }) => Promise<number>;
      };
    }).membershipHistory;
  }

  private async countRenewalsSince(
    idAccount: number,
    sinceUtcInclusive: Date,
  ): Promise<number> {
    return this.membershipHistoryClient().count({
      where: {
        idAccount,
        actionType: MembershipAction.RENEWAL as never,
        createdAt: { gte: sinceUtcInclusive },
      },
    });
  }

  /**
   * Membership renewals (`membership_histories`, action RENEWAL) by UTC calendar month
   * for a fixed semester (H1 or H2) of `year`. Always returns exactly 6 months (zeros filled).
   */
  private async computeRenewalsTrendForHalf(
    idAccount: number,
    year: number,
    half: DashboardSignUpHalf,
  ): Promise<{ month_start: string; count: number }[]> {
    const monthOffsetStart = half === 1 ? 0 : 6;
    const monthStarts: Date[] = [];
    for (let i = 0; i < 6; i += 1) {
      monthStarts.push(new Date(Date.UTC(year, monthOffsetStart + i, 1)));
    }
    const rangeStart = monthStarts[0];
    const rangeEndExclusive = this.addUtcMonths(monthStarts[5], 1);

    const rows = await this.membershipHistoryClient().findMany({
      where: {
        idAccount,
        actionType: MembershipAction.RENEWAL as never,
        createdAt: {
          gte: rangeStart,
          lt: rangeEndExclusive,
        },
      },
      select: { createdAt: true },
    });

    const counts = new Map<string, number>();
    for (const start of monthStarts) {
      counts.set(this.utcYearMonthKey(start), 0);
    }

    for (const row of rows) {
      const key = this.utcYearMonthKey(row.createdAt);
      if (counts.has(key)) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return monthStarts.map((start) => ({
      month_start: start.toISOString().slice(0, 10),
      count: counts.get(this.utcYearMonthKey(start)) ?? 0,
    }));
  }

  /**
   * Six UTC calendar months of membership renewals for `year` + `half` (H1: Jan–Jun, H2: Jul–Dec).
   * Counts only; same rules as `computeRenewalsTrendForHalf`.
   */
  async getRenewalTrendCountsForHalf(
    idAccount: number,
    year: number,
    half: DashboardSignUpHalf,
  ): Promise<number[]> {
    const rows = await this.computeRenewalsTrendForHalf(idAccount, year, half);
    return rows.map((r) => r.count);
  }

  /**
   * Customer sign-ups by UTC calendar month for January–December of `year`.
   * Public entry for isolated dashboard routes; same rules as `computeSignUpTrendForCalendarYear`.
   */
  async getAnnualSignUpTrendForAccount(
    idAccount: number,
    year: number,
  ): Promise<{ month_start: string; count: number }[]> {
    return this.computeSignUpTrendForCalendarYear(idAccount, year);
  }

  /**
   * Customer sign-ups by UTC calendar month for January–December of `year`.
   * Uses profile.createdAt; does not filter by user.status.
   * Always returns exactly 12 months (missing months as count 0).
   */
  private async computeSignUpTrendForCalendarYear(
    idAccount: number,
    year: number,
  ): Promise<{ month_start: string; count: number }[]> {
    const monthStarts: Date[] = [];
    for (let i = 0; i < 12; i += 1) {
      monthStarts.push(new Date(Date.UTC(year, i, 1)));
    }
    const rangeStart = monthStarts[0];
    const rangeEndExclusive = this.addUtcMonths(monthStarts[11], 1);

    const rows = await this.prisma.user.findMany({
      where: {
        idAccount,
        role: UserRole.customer,
        profile: {
          is: {
            createdAt: {
              gte: rangeStart,
              lt: rangeEndExclusive,
            },
          },
        },
      },
      select: {
        profile: { select: { createdAt: true } },
      },
    });

    const counts = new Map<string, number>();
    for (const start of monthStarts) {
      counts.set(this.utcYearMonthKey(start), 0);
    }

    for (const row of rows) {
      const createdAt = row.profile?.createdAt;
      if (!createdAt) {
        continue;
      }
      const key = this.utcYearMonthKey(createdAt);
      if (counts.has(key)) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return monthStarts.map((start) => ({
      month_start: start.toISOString().slice(0, 10),
      count: counts.get(this.utcYearMonthKey(start)) ?? 0,
    }));
  }

  /**
   * Active memberships ending within the next 7 UTC calendar days (inclusive of today through +7),
   * excluding open-ended memberships and far-future ends. Soonest end_date first.
   */
  private async computeExpiringSoonMemberships(
    idAccount: number,
    todayStart: Date,
  ): Promise<{ name: string; days_until_end: number }[]> {
    const weekEndInclusive = addUtcDays(todayStart, 7);
    const rows = await this.prisma.customerMembership.findMany({
      where: {
        idAccount,
        status: GenericStatus.active,
        endDate: {
          not: null,
          gte: todayStart,
          lte: weekEndInclusive,
        },
        user: {
          role: UserRole.customer,
          status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
        },
      },
      select: {
        endDate: true,
        user: {
          select: {
            email: true,
            userNumber: true,
            profile: { select: { name: true, lastName: true } },
          },
        },
      },
      orderBy: { endDate: 'asc' },
      take: 6,
    });

    return rows.map((row) => {
      const endDate = row.endDate as Date;
      return {
        name: this.formatDashboardListCustomerName(row.user),
        days_until_end: utcWholeCalendarDaysBetween(todayStart, endDate),
      };
    });
  }

  /**
   * (Churned / total customer-role users) × 100, 1 decimal. Churned = membership end_date is more
   * than 30 UTC days before today and the row is not a currently valid active membership.
   */
  private async computeCancellationRatePercent(
    idAccount: number,
    todayStart: Date,
  ): Promise<number> {
    const thirtyDaysAgo = subUtcDays(todayStart, 30);
    const baseCustomerWhere: Prisma.UserWhereInput = {
      idAccount,
      role: UserRole.customer,
      status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
    };
    const [totalCustomers, churnedCount] = await Promise.all([
      this.prisma.user.count({ where: baseCustomerWhere }),
      this.prisma.user.count({
        where: {
          ...baseCustomerWhere,
          customerMembership: {
            is: {
              idAccount,
              endDate: { not: null, lt: thirtyDaysAgo },
              NOT: {
                AND: [
                  { status: GenericStatus.active },
                  {
                    OR: [{ endDate: null }, { endDate: { gte: todayStart } }],
                  },
                ],
              },
            },
          },
        },
      }),
    ]);
    if (totalCustomers === 0) {
      return 0;
    }
    return Math.round((churnedCount * 1000) / totalCustomers) / 10;
  }

  /**
   * Top 3 customers by summed calendar tenure from membership_histories (≈30-day months).
   */
  private async computeLoyaltyRanking(
    idAccount: number,
  ): Promise<{ name: string; description: string }[]> {
    type RawRow = { id_user: number; tenure_months: number };
    const raw = await this.prisma.$queryRaw<RawRow[]>(Prisma.sql`
      SELECT mh.id_user::int AS id_user,
        GREATEST(
          0,
          FLOOR(SUM((mh.end_date::date - mh.start_date::date)) / 30.0)
        )::int AS tenure_months
      FROM membership_histories mh
      WHERE mh.id_account = ${idAccount}
      GROUP BY mh.id_user
      HAVING SUM((mh.end_date::date - mh.start_date::date)) > 0
      ORDER BY SUM((mh.end_date::date - mh.start_date::date)) DESC
      LIMIT 3
    `);
    if (raw.length === 0) {
      return [];
    }
    const ids = raw.map((r) => r.id_user);
    const users = await this.prisma.user.findMany({
      where: {
        idUser: { in: ids },
        idAccount,
        role: UserRole.customer,
        status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
      },
      select: {
        idUser: true,
        email: true,
        userNumber: true,
        profile: { select: { name: true, lastName: true } },
      },
    });
    const byId = new Map(users.map((u) => [u.idUser, u]));
    return raw
      .map((row) => {
        const u = byId.get(row.id_user);
        if (!u) {
          return null;
        }
        const name = this.formatDashboardListCustomerName(u);
        const months = Math.max(0, Number(row.tenure_months));
        return { name, description: `${months} meses activos` };
      })
      .filter((r): r is { name: string; description: string } => r !== null);
  }

  /**
   * True when the user's customer_membership row grants access today (UTC): active status and
   * open-ended or end_date on/after today.
   */
  private hasValidCustomerMembershipToday(
    membership: { status: GenericStatus; endDate: Date | null } | null,
    todayStart: Date,
  ): boolean {
    return isValidCustomerMembershipToday(membership, todayStart);
  }

  /**
   * Up to 6 inactive dashboard rows: aim for 2 expired + 2 deleted + 2 banned, then fallback from
   * leftovers (most recent inactiveDate), then round-robin E/D/B so statuses do not clump.
   */
  private async computeInactiveDashboardCustomers(
    idAccount: number,
    todayStart: Date,
  ): Promise<{ name: string; chip_status: 'deleted' | 'banned' | 'expired' }[]> {
    type BucketRow = {
      name: string;
      chip_status: 'deleted' | 'banned' | 'expired';
      inactiveDate: Date;
    };

    const [deletedRows, bannedRows, activeWithMembership] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          idAccount,
          role: UserRole.customer,
          status: GenericStatus.deleted,
        },
        select: {
          editAt: true,
          email: true,
          userNumber: true,
          profile: { select: { name: true, lastName: true } },
        },
        orderBy: { editAt: 'desc' },
        take: 6,
      }),
      this.prisma.user.findMany({
        where: {
          idAccount,
          role: UserRole.customer,
          status: GenericStatus.banned,
        },
        select: {
          editAt: true,
          email: true,
          userNumber: true,
          profile: { select: { name: true, lastName: true } },
        },
        orderBy: { editAt: 'desc' },
        take: 6,
      }),
      this.prisma.user.findMany({
        where: {
          idAccount,
          role: UserRole.customer,
          status: GenericStatus.active,
          customerMembership: { is: { idAccount } },
        },
        select: {
          editAt: true,
          email: true,
          userNumber: true,
          profile: { select: { name: true, lastName: true } },
          customerMembership: {
            select: { status: true, endDate: true },
          },
        },
        take: 50,
      }),
    ]);

    const expiredPool: BucketRow[] = activeWithMembership
      .filter((u) => !this.hasValidCustomerMembershipToday(u.customerMembership, todayStart))
      .map((u) => {
        const m = u.customerMembership;
        const inactiveDate =
          m?.endDate !== null && m?.endDate !== undefined
            ? startOfUtcDay(m.endDate as Date)
            : startOfUtcDay(u.editAt);
        return {
          name: this.formatDashboardListCustomerName({
            email: u.email,
            userNumber: u.userNumber,
            profile: u.profile,
          }),
          chip_status: 'expired' as const,
          inactiveDate,
        };
      })
      .sort((a, b) => b.inactiveDate.getTime() - a.inactiveDate.getTime())
      .slice(0, 6);

    const deletedPool: BucketRow[] = deletedRows.map((u) => ({
      name: this.formatDashboardListCustomerName({
        email: u.email,
        userNumber: u.userNumber,
        profile: u.profile,
      }),
      chip_status: 'deleted' as const,
      inactiveDate: startOfUtcDay(u.editAt),
    }));

    const bannedPool: BucketRow[] = bannedRows.map((u) => ({
      name: this.formatDashboardListCustomerName({
        email: u.email,
        userNumber: u.userNumber,
        profile: u.profile,
      }),
      chip_status: 'banned' as const,
      inactiveDate: startOfUtcDay(u.editAt),
    }));

    const ed = [...expiredPool];
    const del = [...deletedPool];
    const ban = [...bannedPool];

    const finalSelection: BucketRow[] = [];
    finalSelection.push(...ed.splice(0, 2));
    finalSelection.push(...del.splice(0, 2));
    finalSelection.push(...ban.splice(0, 2));

    const leftovers = [...ed, ...del, ...ban];
    leftovers.sort((a, b) => b.inactiveDate.getTime() - a.inactiveDate.getTime());
    while (finalSelection.length < 6 && leftovers.length > 0) {
      finalSelection.push(leftovers.shift()!);
    }

    return this.interleaveInactiveDashboardRows(finalSelection);
  }

  /**
   * Reorders rows in expired → deleted → banned cycles so pages are mixed (no status clumping).
   */
  private interleaveInactiveDashboardRows(
    rows: { name: string; chip_status: 'deleted' | 'banned' | 'expired' }[],
  ): { name: string; chip_status: 'deleted' | 'banned' | 'expired' }[] {
    if (rows.length === 0) {
      return [];
    }
    const expired = rows.filter((r) => r.chip_status === 'expired');
    const deleted = rows.filter((r) => r.chip_status === 'deleted');
    const banned = rows.filter((r) => r.chip_status === 'banned');
    const merged: { name: string; chip_status: 'deleted' | 'banned' | 'expired' }[] = [];
    while (merged.length < rows.length) {
      const before = merged.length;
      if (expired.length > 0) {
        merged.push(expired.shift()!);
      }
      if (merged.length >= rows.length) {
        break;
      }
      if (deleted.length > 0) {
        merged.push(deleted.shift()!);
      }
      if (merged.length >= rows.length) {
        break;
      }
      if (banned.length > 0) {
        merged.push(banned.shift()!);
      }
      if (merged.length === before) {
        break;
      }
    }
    return merged.slice(0, 6).map(({ name, chip_status }) => ({ name, chip_status }));
  }

  /**
   * Active members (same membership rules as KPI) whose profile is at least 2 UTC calendar days old
   * and who have no active check-ins in the last 14 UTC calendar days. Sorted by longest inactivity;
   * users with no entry_logs at all sort after everyone else (placeholder days) for the widget cap.
   */
  private async computeRiskyDashboardCustomers(
    idAccount: number,
    todayUtcStart: Date,
  ): Promise<
    { name: string; description_key: string; description_params?: { days: number } }[]
  > {
    const twoDaysAgoUtc = subUtcDays(todayUtcStart, 2);
    const fourteenDaysAgoUtc = subUtcDays(todayUtcStart, 14);
    const RISKY_I18N_INACTIVE_DAYS = 'DASHBOARD.ACCESS.RISKY_INACTIVE_DAYS';
    const RISKY_I18N_TOO_LONG_AGO = 'DASHBOARD.ACCESS.TOO_LONG_AGO';
    const NO_LOG_SORT_PLACEHOLDER_DAYS = 999;

    const rows = await this.prisma.user.findMany({
      where: {
        idAccount,
        role: UserRole.customer,
        status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
        profile: {
          is: {
            status: GenericStatus.active,
            createdAt: { lte: twoDaysAgoUtc },
          },
        },
        customerMembership: {
          is: {
            idAccount,
            status: GenericStatus.active,
            OR: [{ endDate: null }, { endDate: { gte: todayUtcStart } }],
          },
        },
        entryLogs: {
          none: {
            idAccount,
            status: GenericStatus.active,
            entryDate: { gte: fourteenDaysAgoUtc },
          },
        },
      },
      select: {
        email: true,
        userNumber: true,
        profile: { select: { name: true, lastName: true } },
        entryLogs: {
          where: { idAccount, status: GenericStatus.active },
          orderBy: { entryDate: 'desc' },
          take: 1,
          select: { entryDate: true },
        },
      },
    });

    type SortRow = {
      sortDays: number;
      row: { name: string; description_key: string; description_params?: { days: number } };
    };

    const mapped: SortRow[] = rows.map((u) => {
      const name = this.formatDashboardListCustomerName(u);
      const last = u.entryLogs[0]?.entryDate;
      if (last) {
        const inactiveDays = Math.max(0, utcWholeCalendarDaysBetween(last, todayUtcStart));
        return {
          sortDays: inactiveDays,
          row: {
            name,
            description_key: RISKY_I18N_INACTIVE_DAYS,
            description_params: { days: inactiveDays },
          },
        };
      }
      return {
        sortDays: NO_LOG_SORT_PLACEHOLDER_DAYS,
        row: {
          name,
          description_key: RISKY_I18N_TOO_LONG_AGO,
        },
      };
    });

    mapped.sort((a, b) => b.sortDays - a.sortDays);
    return mapped.slice(0, 10).map((m) => m.row);
  }

  private formatDashboardListCustomerName(user: {
    email: string | null;
    userNumber: string | null;
    profile: { name: string | null; lastName: string | null } | null;
  }): string {
    const parts = [user.profile?.name, user.profile?.lastName].filter(
      (p): p is string => typeof p === 'string' && p.trim().length > 0,
    );
    const full = parts.join(' ').trim();
    if (full.length > 0) {
      return full;
    }
    const email = user.email?.trim();
    if (email) {
      return email;
    }
    const num = user.userNumber?.trim();
    if (num) {
      return `#${num}`;
    }
    return '—';
  }

  /**
   * Active (non-expired) memberships by plan name for customers who are not deleted or banned.
   */
  private async computeMembershipDistributionByPlan(
    idAccount: number,
    today: Date,
  ): Promise<{ name: string; value: number }[]> {
    const rows = await this.prisma.customerMembership.findMany({
      where: {
        idAccount,
        status: GenericStatus.active,
        OR: [{ endDate: null }, { endDate: { gte: today } }],
        user: {
          role: UserRole.customer,
          status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
        },
        membershipType: {
          is: {
            status: { not: GenericStatus.deleted },
          },
        },
      },
      select: {
        membershipType: { select: { name: true } },
      },
    });

    const counts = new Map<string, number>();
    for (const row of rows) {
      const name = row.membershipType.name.trim();
      const label = name.length > 0 ? name : '—';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private async resolveActiveCustomerByIdentifier(identifier: string) {
    const isEmail = identifier.includes('@');

    const includeClause = {
      profile: true,
      account: { select: { status: true, type: true } },
    } satisfies Prisma.UserInclude;

    if (isEmail) {
      const rows = await this.prisma.user.findMany({
        where: {
          email: identifier,
          role: UserRole.customer,
          status: GenericStatus.active,
        },
        include: includeClause,
      });

      const invalidCredentials = () =>
        new UnauthorizedException('AUTH.ERRORS.INVALID_CREDENTIALS');

      if (rows.length === 0) {
        throw invalidCredentials();
      }
      if (rows.length > 1) {
        throw new ConflictException('AUTH.ERRORS.MULTIPLE_ACTIVE_ACCOUNTS');
      }

      return rows[0];
    }

    const byNumber = await this.prisma.user.findUnique({
      where: { userNumber: identifier },
      include: includeClause,
    });

    if (
      !byNumber ||
      byNumber.status !== GenericStatus.active ||
      byNumber.role !== UserRole.customer
    ) {
      throw new UnauthorizedException('AUTH.ERRORS.INVALID_CREDENTIALS');
    }

    return byNumber;
  }

  private static customerDisplayName(
    profile:
      | { name: string | null; lastName: string | null }
      | null
      | undefined,
  ): string {
    const parts = [profile?.name?.trim(), profile?.lastName?.trim()].filter(
      (p): p is string => Boolean(p && p.length > 0),
    );
    return parts.join(' ');
  }
}
