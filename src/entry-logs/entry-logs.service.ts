import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PrismaService } from '../core/prisma/prisma.service';
import { subUtcDays } from '../common/utils/utc-date.util';
import { CustomerAccessLogItemDto } from './dto/customer-access-log-item.dto';
import { CustomerAccessSummaryResponseDto } from './dto/customer-access-summary-response.dto';
import { EntryLogHistoryRowDto } from './dto/entry-log-history-row.dto';
import type { EntryLogListQueryDto } from './dto/entry-log-list-query.dto';
import { EntryLogsPaginatedResponseDto } from './dto/entry-logs-paginated-response.dto';
import { KioskAccessCodeResponseDto } from './dto/kiosk-access-code-response.dto';
import { ManualCheckinDto } from './dto/manual-checkin.dto';
import { ManualCheckinResponseDto } from './dto/manual-checkin-response.dto';
import { EntryLogPublicResponseDto } from './dto/entry-log-public-response.dto';
import type { RecordEntryParams } from './types/record-entry.params';
import { buildCustomerDisplayName } from './utils/build-customer-display-name';
import { generateKioskAccessCode } from './utils/generate-kiosk-access-code.util';
import {
  normalizeAccessCode,
  parseCheckinDateTime,
} from './utils/parse-checkin-datetime.util';

const HISTORY_WINDOW_DAYS = 30;

type HistorySortField =
  | 'entryDate'
  | 'userNumber'
  | 'fullName'
  | 'emergencyPhone';

@Injectable()
export class EntryLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inserts one entry log row. Caller must enforce tenant and business rules.
   */
  async recordEntry(data: RecordEntryParams) {
    return this.prisma.entryLog.create({
      data: {
        idAccount: data.idAccount,
        idUser: data.idUser,
        entryDate: data.entryDate ?? new Date(),
        status: data.status,
      },
    });
  }

  async manualCheckin(
    user: JwtPayload,
    dto: ManualCheckinDto,
  ): Promise<ManualCheckinResponseDto> {
    const idAccount = user.id_account;
    const idUser = user.sub;

    const dbUser = await this.prisma.user.findFirst({
      where: {
        idUser,
        idAccount,
        role: UserRole.customer,
        status: GenericStatus.active,
      },
      select: { userNumber: true },
    });

    if (!dbUser) {
      throw new UnauthorizedException('AUTH.ERRORS.INVALID_SESSION');
    }

    const submittedUserNumber = dto.userNumber.trim();
    if (!dbUser.userNumber || dbUser.userNumber !== submittedUserNumber) {
      throw new UnauthorizedException('ACCESS.ERRORS.USER_NUMBER_MISMATCH');
    }

    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount },
      select: { accessCode: true },
    });

    if (!detail?.accessCode?.trim()) {
      throw new UnauthorizedException('ACCESS.ERRORS.INVALID_ACCESS_CODE');
    }

    const submittedCode = normalizeAccessCode(dto.accessCode);
    const storedCode = normalizeAccessCode(detail.accessCode);
    if (submittedCode !== storedCode) {
      throw new UnauthorizedException('ACCESS.ERRORS.INVALID_ACCESS_CODE');
    }

    const entryDate = parseCheckinDateTime(dto.date, dto.time);

    await this.recordEntry({
      idAccount,
      idUser,
      status: GenericStatus.active,
      entryDate,
    });

    return plainToInstance(
      ManualCheckinResponseDto,
      {
        status: 'success',
        message: 'ACCESS.CHECKIN_RECORDED',
      },
      { excludeExtraneousValues: true },
    );
  }

  async getKioskAccessCode(idAccount: number): Promise<KioskAccessCodeResponseDto> {
    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount },
      select: { accessCode: true },
    });

    if (!detail) {
      throw new NotFoundException('ACCOUNTS.ERRORS.DETAIL_NOT_FOUND');
    }

    let accessCode = detail.accessCode?.trim() ?? '';
    if (!accessCode.length) {
      accessCode = generateKioskAccessCode();
      await this.prisma.accountDetail.update({
        where: { idAccount },
        data: { accessCode },
      });
    }

    return plainToInstance(
      KioskAccessCodeResponseDto,
      { access_code: accessCode },
      { excludeExtraneousValues: true },
    );
  }

  async registerByUserNumber(
    idAccount: number,
    userNumber: string,
  ): Promise<EntryLogPublicResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        userNumber,
        idAccount,
        status: GenericStatus.active,
      },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('ENTRY_LOGS.ERRORS.USER_NOT_FOUND');
    }

    const row = await this.recordEntry({
      idAccount,
      idUser: user.idUser,
      status: GenericStatus.active,
    });

    const customerName = buildCustomerDisplayName(user);

    return plainToInstance(
      EntryLogPublicResponseDto,
      {
        entryDate: row.entryDate,
        status: row.status,
        customerName,
      },
      { excludeExtraneousValues: true },
    );
  }

  async findHistoryPage(
    idAccount: number,
    query: EntryLogListQueryDto,
  ): Promise<EntryLogsPaginatedResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const sortBy = (query.sortBy ?? 'entryDate') as HistorySortField;
    const sortOrder = query.sortOrder ?? 'desc';
    const search = query.search?.trim();

    const where: Prisma.EntryLogWhereInput = {
      idAccount,
      status: GenericStatus.active,
      user: {
        status: { not: GenericStatus.deleted },
        ...(search
          ? {
              OR: [
                {
                  userNumber: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  profile: {
                    is: {
                      OR: [
                        {
                          name: {
                            contains: search,
                            mode: Prisma.QueryMode.insensitive,
                          },
                        },
                        {
                          lastName: {
                            contains: search,
                            mode: Prisma.QueryMode.insensitive,
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
    };

    const orderBy = this.buildHistoryOrderBy(sortBy, sortOrder);
    const skip = (page - 1) * pageSize;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.entryLog.count({ where }),
      this.prisma.entryLog.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          user: { include: { profile: true } },
        },
      }),
    ]);

    const data = rows.map((r) =>
      plainToInstance(
        EntryLogHistoryRowDto,
        {
          idEntryLog: r.idEntryLog,
          idUser: r.idUser,
          userNumber: r.user.userNumber,
          fullName: buildCustomerDisplayName(r.user),
          emergencyPhone: r.user.profile?.emergencyPhone ?? null,
          entryDate: r.entryDate,
          status: r.status,
        },
        { excludeExtraneousValues: true },
      ),
    );

    return plainToInstance(
      EntryLogsPaginatedResponseDto,
      { data, total },
      { excludeExtraneousValues: true },
    );
  }

  async findCustomerAccessSummary(
    idAccount: number,
    idUser: number,
  ): Promise<CustomerAccessSummaryResponseDto> {
    const since = subUtcDays(new Date(), HISTORY_WINDOW_DAYS);

    const user = await this.prisma.user.findFirst({
      where: {
        idUser,
        idAccount,
        status: { not: GenericStatus.deleted },
      },
      include: {
        profile: true,
        customerMembership: {
          include: { membershipType: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('ENTRY_LOGS.ERRORS.USER_NOT_FOUND');
    }

    const logs = await this.prisma.entryLog.findMany({
      where: {
        idAccount,
        idUser,
        status: GenericStatus.active,
        entryDate: { gte: since },
      },
      orderBy: { entryDate: 'desc' },
      select: { idEntryLog: true, entryDate: true },
    });

    const membership = user.customerMembership;
    const planName =
      membership?.membershipType?.status === GenericStatus.deleted
        ? null
        : (membership?.membershipType?.name ?? null);

    const entries = logs.map((log) =>
      plainToInstance(
        CustomerAccessLogItemDto,
        { idEntryLog: log.idEntryLog, entryDate: log.entryDate },
        { excludeExtraneousValues: true },
      ),
    );

    return plainToInstance(
      CustomerAccessSummaryResponseDto,
      {
        idUser: user.idUser,
        userNumber: user.userNumber,
        fullName: buildCustomerDisplayName(user),
        emergencyPhone: user.profile?.emergencyPhone ?? null,
        membershipPlanName: planName,
        membershipStatus: membership?.status ?? null,
        entries,
      },
      { excludeExtraneousValues: true },
    );
  }

  private buildHistoryOrderBy(
    sortBy: HistorySortField,
    sortOrder: 'asc' | 'desc',
  ):
    | Prisma.EntryLogOrderByWithRelationInput
    | Prisma.EntryLogOrderByWithRelationInput[] {
    const dir = sortOrder;
    switch (sortBy) {
      case 'userNumber':
        return { user: { userNumber: dir } };
      case 'fullName':
        return [
          { user: { profile: { lastName: dir } } },
          { user: { profile: { name: dir } } },
        ];
      case 'emergencyPhone':
        return { user: { profile: { emergencyPhone: dir } } };
      case 'entryDate':
      default:
        return { entryDate: dir };
    }
  }
}
