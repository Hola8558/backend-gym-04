import { Injectable, NotFoundException } from '@nestjs/common';
import { GenericStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../core/prisma/prisma.service';
import {
  KIOSK_SEARCH_MAX_RESULTS,
  KIOSK_SEARCH_MIN_QUERY_LENGTH,
} from './constants/kiosk-search.const';
import { KioskCheckinResponseDto } from './dto/kiosk-checkin-response.dto';
import type { KioskCustomerResultDto } from './dto/kiosk-customer-result.dto';
import { EntryLogsService } from './entry-logs.service';
import {
  kioskCustomerCandidateSelect,
  type KioskCustomerCandidate,
} from './types/kiosk-customer-candidate.type';
import { activeKioskCustomerWhere } from './utils/active-kiosk-customer-where.util';
import { buildCustomerDisplayName } from './utils/build-customer-display-name';
import { matchesKioskSearch } from './utils/matches-kiosk-search.util';
import { normalizeSearchText } from './utils/normalize-search-text.util';
import { toKioskCustomerResult } from './utils/to-kiosk-customer-result.mapper';

@Injectable()
export class EntryLogsKioskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entryLogsService: EntryLogsService,
  ) {}

  /**
   * Matching runs in memory over the tenant's active customers (served by the
   * `users(id_account, role, status)` index) so it can be accent-insensitive
   * without requiring the Postgres `unaccent` extension.
   */
  async searchCustomers(
    idAccount: number,
    query: string,
  ): Promise<KioskCustomerResultDto[]> {
    const normalizedQuery = normalizeSearchText(query);
    if (normalizedQuery.length < KIOSK_SEARCH_MIN_QUERY_LENGTH) {
      return [];
    }

    const candidates = await this.prisma.user.findMany({
      where: activeKioskCustomerWhere(idAccount),
      select: kioskCustomerCandidateSelect,
      orderBy: [{ profile: { name: 'asc' } }, { profile: { lastName: 'asc' } }],
    });

    return candidates
      .filter((candidate) => matchesKioskSearch(normalizedQuery, candidate))
      .slice(0, KIOSK_SEARCH_MAX_RESULTS)
      .map(toKioskCustomerResult);
  }

  async previewByUserNumber(
    idAccount: number,
    userNumber: string,
  ): Promise<KioskCustomerResultDto> {
    const candidate = await this.findActiveCustomer(idAccount, {
      userNumber: userNumber.trim(),
    });
    return toKioskCustomerResult(candidate);
  }

  async checkInByUserId(
    idAccount: number,
    idUser: number,
  ): Promise<KioskCheckinResponseDto> {
    const candidate = await this.findActiveCustomer(idAccount, { idUser });

    const row = await this.entryLogsService.recordEntry({
      idAccount,
      idUser: candidate.idUser,
      status: GenericStatus.active,
    });

    return plainToInstance(
      KioskCheckinResponseDto,
      {
        entryDate: row.entryDate,
        status: row.status,
        customerName: buildCustomerDisplayName(candidate),
        userNumber: candidate.userNumber,
      },
      { excludeExtraneousValues: true },
    );
  }

  private async findActiveCustomer(
    idAccount: number,
    criteria: { idUser: number } | { userNumber: string },
  ): Promise<KioskCustomerCandidate> {
    const candidate = await this.prisma.user.findFirst({
      where: { ...activeKioskCustomerWhere(idAccount), ...criteria },
      select: kioskCustomerCandidateSelect,
    });

    if (!candidate) {
      throw new NotFoundException('ENTRY_LOGS.ERRORS.USER_NOT_FOUND');
    }
    return candidate;
  }
}
