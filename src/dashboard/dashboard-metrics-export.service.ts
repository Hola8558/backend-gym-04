import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/jwt.strategy';
import { isValidIanaTimeZone, getZonedCalendarDayRangeUtc } from '../common/utils/zoned-day-range.util';
import { addUtcDays, startOfUtcDay, subUtcDays, utcWholeCalendarDaysBetween } from '../common/utils/utc-date.util';
import { currentCustomerMembershipRelation } from '../customer-memberships/utils/current-customer-membership.util';
import { PrismaService } from '../core/prisma/prisma.service';
import { MembershipAction } from '../membership-audit/types/membership-action.const';
import { isValidCustomerMembershipToday } from '../customers/utils/is-valid-customer-membership.util';
import {
  DASHBOARD_FEATURE_ENTRY_LOGS,
  evaluateDashboardMetricsGates,
} from './dashboard-metrics-gates';
import type {
  DashboardExportMetric,
  DashboardExportRow,
} from './types/dashboard-export-metric.type';
import { isDashboardExportMetric } from './types/dashboard-export-metric.type';
import {
  ageInYears,
  formatInTimeZone,
  identityColumns,
  isoDate,
  isoDateTime,
  membershipOf,
  personName,
  trimmed,
  type ExportCustomerFields,
} from './utils/dashboard-export-customer.util';

const MEMBERSHIP_METRICS: readonly DashboardExportMetric[] = [
  'renewals',
  'expiring_soon',
  'loyalty',
];

const ACCESS_METRICS: readonly DashboardExportMetric[] = [
  'attendance_today',
  'risky_customers',
];

const customerSelect = {
  idUser: true,
  userNumber: true,
  email: true,
  status: true,
  editAt: true,
  birthdate: true,
  profile: {
    select: {
      name: true,
      lastName: true,
      phone: true,
      emergencyPhone: true,
      enrollmentDate: true,
      createdAt: true,
      coach: {
        select: {
          profile: { select: { name: true, lastName: true } },
        },
      },
    },
  },
  customerMemberships: currentCustomerMembershipRelation({
    status: true,
    startDate: true,
    endDate: true,
    membershipType: { select: { name: true, price: true } },
  }),
} satisfies Prisma.UserSelect;

@Injectable()
export class DashboardMetricsExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportMetrics(
    user: JwtPayload,
    metricsRaw: string,
    loyaltyBy: 'memberships' | 'enrollment',
    timeZoneRaw?: string,
  ): Promise<{
    sheets: { metric: DashboardExportMetric; rows: DashboardExportRow[] }[];
  }> {
    const requested = this.parseMetrics(metricsRaw);
    const allowed = await this.filterAllowed(user, requested);
    if (allowed.length === 0) {
      throw new ForbiddenException('SECURITY.ERRORS.ACCESS_DENIED');
    }

    const timeZone =
      timeZoneRaw && isValidIanaTimeZone(timeZoneRaw) ? timeZoneRaw : 'UTC';
    const today = startOfUtcDay(new Date());
    const gates = await this.gatesFor(user);
    const idAccount = user.id_account;

    const sheets = await Promise.all(
      allowed.map(async (metric) => ({
        metric,
        rows: await this.rowsFor(metric, {
          idAccount,
          today,
          timeZone,
          loyaltyBy,
          membershipManaged: gates.canViewMemberships,
        }),
      })),
    );
    return { sheets };
  }

  private parseMetrics(raw: string): DashboardExportMetric[] {
    const tokens = raw
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
    if (tokens.length === 0) {
      throw new BadRequestException('DASHBOARD.ERRORS.INVALID_EXPORT_METRICS');
    }
    const unique: DashboardExportMetric[] = [];
    for (const token of tokens) {
      if (!isDashboardExportMetric(token) || unique.includes(token)) {
        if (!isDashboardExportMetric(token)) {
          throw new BadRequestException('DASHBOARD.ERRORS.INVALID_EXPORT_METRICS');
        }
        continue;
      }
      unique.push(token);
    }
    return unique;
  }

  private async filterAllowed(
    user: JwtPayload,
    metrics: DashboardExportMetric[],
  ): Promise<DashboardExportMetric[]> {
    const gates = await this.gatesFor(user);
    const canAccess =
      user.role === UserRole.coach
        ? await this.accountOwnerHasFeature(user.id_account, DASHBOARD_FEATURE_ENTRY_LOGS)
        : gates.canViewAccess;
    return metrics.filter((metric) => {
      if (MEMBERSHIP_METRICS.includes(metric)) {
        return gates.canViewMemberships;
      }
      if (ACCESS_METRICS.includes(metric)) {
        return canAccess;
      }
      return true;
    });
  }

  private async gatesFor(user: JwtPayload) {
    const rows = await this.prisma.featureFlag.findMany({
      where: {
        idUser: user.sub,
        status: GenericStatus.active,
        feature: { status: GenericStatus.active },
      },
      select: { idFeature: true },
    });
    return evaluateDashboardMetricsGates(
      user.role,
      rows.map((row) => row.idFeature),
    );
  }

  private async accountOwnerHasFeature(idAccount: number, idFeature: number): Promise<boolean> {
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
    const flag = await this.prisma.featureFlag.findFirst({
      where: {
        idUser: owner.idUser,
        idFeature,
        status: GenericStatus.active,
        feature: { status: GenericStatus.active },
      },
      select: { idFeature: true },
    });
    return flag != null;
  }

  private rowsFor(
    metric: DashboardExportMetric,
    ctx: {
      idAccount: number;
      today: Date;
      timeZone: string;
      loyaltyBy: 'memberships' | 'enrollment';
      membershipManaged: boolean;
    },
  ): Promise<DashboardExportRow[]> {
    switch (metric) {
      case 'active_customers':
        return this.activeCustomers(ctx.idAccount, ctx.today, ctx.membershipManaged);
      case 'new_customers':
        return this.newCustomers(ctx.idAccount, ctx.today);
      case 'birthdays':
        return this.birthdays(ctx.idAccount, ctx.today, ctx.membershipManaged);
      case 'inactive_customers':
        return this.inactiveCustomers(ctx.idAccount, ctx.today, ctx.membershipManaged);
      case 'renewals':
        return this.renewals(ctx.idAccount, ctx.today);
      case 'expiring_soon':
        return this.expiringSoon(ctx.idAccount, ctx.today);
      case 'loyalty':
        return this.loyalty(ctx.idAccount, ctx.loyaltyBy);
      case 'attendance_today':
        return this.attendanceToday(ctx.idAccount, ctx.timeZone);
      case 'risky_customers':
        return this.riskyCustomers(ctx.idAccount, ctx.today);
      default:
        return Promise.resolve([]);
    }
  }

  private activeWhere(idAccount: number, today: Date, membershipManaged: boolean): Prisma.UserWhereInput {
    if (!membershipManaged) {
      return {
        idAccount,
        role: UserRole.customer,
        status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
      };
    }
    return {
      idAccount,
      role: UserRole.customer,
      status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
      customerMemberships: {
        some: {
          isCurrent: true,
          idAccount,
          status: GenericStatus.active,
          OR: [{ endDate: null }, { endDate: { gte: today } }],
        },
      },
    };
  }

  private async activeCustomers(
    idAccount: number,
    today: Date,
    membershipManaged: boolean,
  ): Promise<DashboardExportRow[]> {
    const rows = await this.prisma.user.findMany({
      where: this.activeWhere(idAccount, today, membershipManaged),
      select: customerSelect,
      orderBy: [{ profile: { lastName: 'asc' } }, { profile: { name: 'asc' } }],
    });
    return rows.map((row) => {
      const membership = membershipOf(row);
      return {
        ...identityColumns(row),
        emergency_phone: trimmed(row.profile?.emergencyPhone),
        membership: trimmed(membership?.membershipType.name),
        membership_start: isoDate(membership?.startDate),
        membership_end: isoDate(membership?.endDate),
        coach: personName(row.profile?.coach?.profile),
        enrollment_date: isoDate(row.profile?.enrollmentDate),
        status: row.status,
      };
    });
  }

  private async newCustomers(idAccount: number, today: Date): Promise<DashboardExportRow[]> {
    const since = subUtcDays(today, 30);
    const rows = await this.prisma.user.findMany({
      where: {
        idAccount,
        role: UserRole.customer,
        profile: { is: { createdAt: { gte: since } } },
      },
      select: customerSelect,
      orderBy: { profile: { createdAt: 'desc' } },
    });
    return rows.map((row) => {
      const membership = membershipOf(row);
      return {
        ...identityColumns(row),
        emergency_phone: trimmed(row.profile?.emergencyPhone),
        created_at: isoDateTime(row.profile?.createdAt),
        membership: trimmed(membership?.membershipType.name),
        membership_end: isoDate(membership?.endDate),
        coach: personName(row.profile?.coach?.profile),
        status: row.status,
      };
    });
  }

  private async birthdays(
    idAccount: number,
    today: Date,
    membershipManaged: boolean,
  ): Promise<DashboardExportRow[]> {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    const rows = await this.prisma.user.findMany({
      where: {
        ...this.activeWhere(idAccount, today, membershipManaged),
        birthdate: { not: null },
      },
      select: customerSelect,
    });
    const matched = rows.flatMap((row) => {
      if (!row.birthdate) {
        return [];
      }
      const iso = row.birthdate.toISOString().slice(0, 10);
      const parts = iso.split('-').map(Number);
      const birthMonth = parts[1] - 1;
      const birthDay = parts[2];
      if (birthMonth !== month) {
        return [];
      }
      const membership = membershipOf(row);
      return [
        {
          sortDay: birthDay,
          row: {
            ...identityColumns(row),
            birthdate: iso,
            age: ageInYears(row.birthdate, today),
            is_today: birthDay === day,
            membership: trimmed(membership?.membershipType.name),
          },
        },
      ];
    });
    matched.sort((a, b) => a.sortDay - b.sortDay);
    return matched.map((item) => item.row);
  }

  private async inactiveCustomers(
    idAccount: number,
    today: Date,
    membershipManaged: boolean,
  ): Promise<DashboardExportRow[]> {
    const [deletedRows, bannedRows, expiredRows] = await Promise.all([
      this.prisma.user.findMany({
        where: { idAccount, role: UserRole.customer, status: GenericStatus.deleted },
        select: customerSelect,
        orderBy: { editAt: 'desc' },
      }),
      this.prisma.user.findMany({
        where: { idAccount, role: UserRole.customer, status: GenericStatus.banned },
        select: customerSelect,
        orderBy: { editAt: 'desc' },
      }),
      membershipManaged ? this.expiredCustomers(idAccount, today) : Promise.resolve([]),
    ]);

    const mapStatus = (
      row: ExportCustomerFields & { editAt: Date },
      reason: 'deleted' | 'banned',
    ): DashboardExportRow => {
      const membership = membershipOf(row);
      return {
        ...identityColumns(row),
        reason,
        since: isoDate(row.editAt),
        membership: trimmed(membership?.membershipType.name),
        membership_end: isoDate(membership?.endDate),
      };
    };

    return [
      ...expiredRows,
      ...deletedRows.map((row) => mapStatus(row, 'deleted')),
      ...bannedRows.map((row) => mapStatus(row, 'banned')),
    ];
  }

  private async expiredCustomers(idAccount: number, today: Date): Promise<DashboardExportRow[]> {
    const rows = await this.prisma.user.findMany({
      where: {
        idAccount,
        role: UserRole.customer,
        status: GenericStatus.active,
        customerMemberships: {
          some: {
            isCurrent: true,
            status: { not: GenericStatus.deleted },
            idAccount,
          },
        },
      },
      select: customerSelect,
    });
    return rows
      .filter((row) => !isValidCustomerMembershipToday(membershipOf(row), today))
      .map((row) => {
        const membership = membershipOf(row);
        return {
          sinceDate: membership?.endDate ?? row.editAt,
          row: {
            ...identityColumns(row),
            reason: 'expired',
            since: isoDate(membership?.endDate ?? row.editAt),
            membership: trimmed(membership?.membershipType.name),
            membership_end: isoDate(membership?.endDate),
          } satisfies DashboardExportRow,
        };
      })
      .sort((a, b) => b.sinceDate.getTime() - a.sinceDate.getTime())
      .map((item) => item.row);
  }

  private async renewals(idAccount: number, today: Date): Promise<DashboardExportRow[]> {
    const since = subUtcDays(today, 30);
    const rows = await this.prisma.membershipHistory.findMany({
      where: {
        idAccount,
        actionType: MembershipAction.RENEWAL as never,
        createdAt: { gte: since },
      },
      select: {
        createdAt: true,
        startDate: true,
        endDate: true,
        oldMembership: { select: { endDate: true } },
        newMembership: {
          select: { membershipType: { select: { name: true } } },
        },
        user: { select: customerSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      ...identityColumns(row.user),
      membership: trimmed(row.newMembership.membershipType.name),
      previous_end: isoDate(row.oldMembership?.endDate),
      start_date: isoDate(row.startDate),
      end_date: isoDate(row.endDate),
      renewed_at: isoDateTime(row.createdAt),
    }));
  }

  private async expiringSoon(idAccount: number, today: Date): Promise<DashboardExportRow[]> {
    const weekEnd = addUtcDays(today, 7);
    const rows = await this.prisma.customerMembership.findMany({
      where: {
        idAccount,
        isCurrent: true,
        status: GenericStatus.active,
        endDate: { not: null, gte: today, lte: weekEnd },
        user: {
          role: UserRole.customer,
          status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
        },
      },
      select: {
        endDate: true,
        membershipType: { select: { name: true, price: true } },
        user: { select: customerSelect },
      },
      orderBy: { endDate: 'asc' },
    });
    return rows.map((row) => {
      const endDate = row.endDate as Date;
      return {
        ...identityColumns(row.user),
        membership: trimmed(row.membershipType.name),
        price: row.membershipType.price.toString(),
        end_date: isoDate(endDate),
        days_left: utcWholeCalendarDaysBetween(today, endDate),
      };
    });
  }

  private async loyalty(
    idAccount: number,
    loyaltyBy: 'memberships' | 'enrollment',
  ): Promise<DashboardExportRow[]> {
    const users = await this.prisma.user.findMany({
      where: {
        idAccount,
        role: UserRole.customer,
        status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
      },
      select: customerSelect,
    });
    const tenure = await this.prisma.$queryRaw<{ id_user: number; tenure_months: number }[]>(
      Prisma.sql`
        SELECT mh.id_user::int AS id_user,
          GREATEST(
            0,
            FLOOR(SUM((mh.end_date::date - mh.start_date::date)) / 30.0)
          )::int AS tenure_months
        FROM membership_histories mh
        WHERE mh.id_account = ${idAccount}
        GROUP BY mh.id_user
      `,
    );
    const monthsByUser = new Map(tenure.map((row) => [row.id_user, Math.max(0, Number(row.tenure_months))]));
    const ranked = users.map((user) => {
      const membership = membershipOf(user);
      return {
        tenureMonths: monthsByUser.get(user.idUser) ?? 0,
        enrollment: user.profile?.enrollmentDate ?? null,
        row: {
          ...identityColumns(user),
          membership: trimmed(membership?.membershipType.name),
          tenure_months: monthsByUser.get(user.idUser) ?? 0,
          enrollment_date: isoDate(user.profile?.enrollmentDate),
        },
      };
    });
    ranked.sort((a, b) => {
      if (loyaltyBy === 'enrollment') {
        if (a.enrollment && b.enrollment) {
          return a.enrollment.getTime() - b.enrollment.getTime();
        }
        if (a.enrollment) {
          return -1;
        }
        if (b.enrollment) {
          return 1;
        }
        return b.tenureMonths - a.tenureMonths;
      }
      return b.tenureMonths - a.tenureMonths;
    });
    return ranked.map((item, index) => ({
      rank: index + 1,
      ...item.row,
    }));
  }

  private async attendanceToday(
    idAccount: number,
    timeZone: string,
  ): Promise<DashboardExportRow[]> {
    const range = getZonedCalendarDayRangeUtc(new Date(), timeZone);
    const rows = await this.prisma.entryLog.findMany({
      where: {
        idAccount,
        status: GenericStatus.active,
        entryDate: { gte: range.start, lt: range.endExclusive },
      },
      select: {
        entryDate: true,
        user: { select: customerSelect },
      },
      orderBy: { entryDate: 'desc' },
    });
    return rows.map((row) => {
      const membership = membershipOf(row.user);
      return {
        ...identityColumns(row.user),
        membership: trimmed(membership?.membershipType.name),
        entry_at: formatInTimeZone(row.entryDate, timeZone),
      };
    });
  }

  private async riskyCustomers(idAccount: number, today: Date): Promise<DashboardExportRow[]> {
    const twoDaysAgo = subUtcDays(today, 2);
    const fourteenDaysAgo = subUtcDays(today, 14);
    const rows = await this.prisma.user.findMany({
      where: {
        idAccount,
        role: UserRole.customer,
        status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
        profile: {
          is: {
            status: GenericStatus.active,
            createdAt: { lte: twoDaysAgo },
          },
        },
        customerMemberships: {
          some: {
            isCurrent: true,
            idAccount,
            status: GenericStatus.active,
            OR: [{ endDate: null }, { endDate: { gte: today } }],
          },
        },
        entryLogs: {
          none: {
            idAccount,
            status: GenericStatus.active,
            entryDate: { gte: fourteenDaysAgo },
          },
        },
      },
      select: {
        ...customerSelect,
        entryLogs: {
          where: { idAccount, status: GenericStatus.active },
          orderBy: { entryDate: 'desc' },
          take: 1,
          select: { entryDate: true },
        },
      },
    });
    const mapped = rows.map((row) => {
      const last = row.entryLogs[0]?.entryDate ?? null;
      const membership = membershipOf(row);
      const days = last ? Math.max(0, utcWholeCalendarDaysBetween(last, today)) : null;
      return {
        sortDays: days ?? 99999,
        row: {
          ...identityColumns(row),
          membership: trimmed(membership?.membershipType.name),
          days_without_visit: days,
          last_visit: isoDate(last),
        } satisfies DashboardExportRow,
      };
    });
    mapped.sort((a, b) => b.sortDays - a.sortDays);
    return mapped.map((item) => item.row);
  }
}
