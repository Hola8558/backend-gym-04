import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../core/prisma/prisma.service';
import { ATTENDANCE_DAY_MAX_RANGE_MS } from './constants/attendance-day.const';
import { CustomerAccessLogItemDto } from './dto/customer-access-log-item.dto';
import { UnmarkAttendanceDayResponseDto } from './dto/unmark-attendance-day-response.dto';
import { EntryLogsService } from './entry-logs.service';
import { isWithinEntryLogRetention } from './utils/is-within-entry-log-retention.util';

/** Staff corrections of a customer's attendance days (customer detail calendar). */
@Injectable()
export class EntryLogsAttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entryLogsService: EntryLogsService,
  ) {}

  async markDay(
    idAccount: number,
    idUser: number,
    entryDateIso: string,
  ): Promise<CustomerAccessLogItemDto> {
    const entryDate = new Date(entryDateIso);
    if (!isWithinEntryLogRetention(entryDate)) {
      throw new BadRequestException('ENTRY_LOGS.ERRORS.DATE_OUT_OF_RANGE');
    }
    await this.assertUserInAccount(idAccount, idUser);

    const row = await this.entryLogsService.recordEntry({
      idAccount,
      idUser,
      status: GenericStatus.active,
      entryDate,
    });

    return plainToInstance(
      CustomerAccessLogItemDto,
      { idEntryLog: row.idEntryLog, entryDate: row.entryDate },
      { excludeExtraneousValues: true },
    );
  }

  /** Soft delete: every active log of the user inside [from, to). */
  async unmarkDay(
    idAccount: number,
    idUser: number,
    fromIso: string,
    toIso: string,
  ): Promise<UnmarkAttendanceDayResponseDto> {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    const span = to.getTime() - from.getTime();
    if (span <= 0 || span > ATTENDANCE_DAY_MAX_RANGE_MS) {
      throw new BadRequestException('ENTRY_LOGS.ERRORS.INVALID_DAY_RANGE');
    }
    await this.assertUserInAccount(idAccount, idUser);

    const result = await this.prisma.entryLog.updateMany({
      where: {
        idAccount,
        idUser,
        status: GenericStatus.active,
        entryDate: { gte: from, lt: to },
      },
      data: { status: GenericStatus.deleted },
    });

    return plainToInstance(
      UnmarkAttendanceDayResponseDto,
      { removed: result.count },
      { excludeExtraneousValues: true },
    );
  }

  private async assertUserInAccount(idAccount: number, idUser: number): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { idUser, idAccount, status: { not: GenericStatus.deleted } },
      select: { idUser: true },
    });
    if (!user) {
      throw new NotFoundException('ENTRY_LOGS.ERRORS.USER_NOT_FOUND');
    }
  }
}
