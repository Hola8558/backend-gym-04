import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CustomerAccessLogItemDto } from './dto/customer-access-log-item.dto';
import { CustomerAccessSummaryResponseDto } from './dto/customer-access-summary-response.dto';
import { EntryLogListQueryDto } from './dto/entry-log-list-query.dto';
import { EntryLogsPaginatedResponseDto } from './dto/entry-logs-paginated-response.dto';
import { KioskAccessCodeResponseDto } from './dto/kiosk-access-code-response.dto';
import { MarkAttendanceDayDto } from './dto/mark-attendance-day.dto';
import { UnmarkAttendanceDayQueryDto } from './dto/unmark-attendance-day-query.dto';
import { UnmarkAttendanceDayResponseDto } from './dto/unmark-attendance-day-response.dto';
import { EntryLogsAttendanceService } from './entry-logs-attendance.service';
import { EntryLogsService } from './entry-logs.service';

@ApiTags('entry-logs')
@ApiBearerAuth()
@Controller(['entry-logs', 'access'])
@UseGuards(FeatureGuard, RolesGuard)
@RequireFeature(5010)
@Roles(UserRole.owner, UserRole.coach)
export class EntryLogsController {
  constructor(
    private readonly entryLogsService: EntryLogsService,
    private readonly attendanceService: EntryLogsAttendanceService,
  ) {}

  @Get('kiosk-code')
  @ApiOperation({ summary: 'Daily kiosk check-in code for the current gym (XXX-XXX)' })
  @ApiResponse({ status: 200, type: KioskAccessCodeResponseDto })
  @ApiResponse({ status: 404, description: 'ACCOUNTS.ERRORS.DETAIL_NOT_FOUND' })
  getKioskCode(
    @CurrentUser() user: JwtPayload,
  ): Promise<KioskAccessCodeResponseDto> {
    return this.entryLogsService.getKioskAccessCode(user.id_account);
  }

  @Get()
  @ApiOperation({ summary: 'Paginated global entry log history for the account' })
  @ApiResponse({ status: 200, type: EntryLogsPaginatedResponseDto })
  findHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: EntryLogListQueryDto,
  ) {
    return this.entryLogsService.findHistoryPage(user.id_account, query);
  }

  @Get('user/:idUser')
  @ApiOperation({
    summary: 'Customer header + entry logs for the last 30 days (UTC window)',
  })
  @ApiResponse({ status: 200, type: CustomerAccessSummaryResponseDto })
  @ApiResponse({ status: 404, description: 'User not in account' })
  findCustomerAccess(
    @CurrentUser() user: JwtPayload,
    @Param('idUser', ParseIntPipe) idUser: number,
  ) {
    return this.entryLogsService.findCustomerAccessSummary(
      user.id_account,
      idUser,
    );
  }

  @Post('user/:idUser/days')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mark an attendance day for a customer (within the 30-day window)' })
  @ApiResponse({ status: 201, type: CustomerAccessLogItemDto })
  @ApiResponse({ status: 400, description: 'ENTRY_LOGS.ERRORS.DATE_OUT_OF_RANGE' })
  @ApiResponse({ status: 404, description: 'ENTRY_LOGS.ERRORS.USER_NOT_FOUND' })
  markAttendanceDay(
    @CurrentUser() user: JwtPayload,
    @Param('idUser', ParseIntPipe) idUser: number,
    @Body() dto: MarkAttendanceDayDto,
  ): Promise<CustomerAccessLogItemDto> {
    return this.attendanceService.markDay(user.id_account, idUser, dto.entry_date);
  }

  @Delete('user/:idUser/days')
  @ApiOperation({ summary: 'Unmark an attendance day (soft-deletes the logs in [from, to))' })
  @ApiResponse({ status: 200, type: UnmarkAttendanceDayResponseDto })
  @ApiResponse({ status: 400, description: 'ENTRY_LOGS.ERRORS.INVALID_DAY_RANGE' })
  @ApiResponse({ status: 404, description: 'ENTRY_LOGS.ERRORS.USER_NOT_FOUND' })
  unmarkAttendanceDay(
    @CurrentUser() user: JwtPayload,
    @Param('idUser', ParseIntPipe) idUser: number,
    @Query() query: UnmarkAttendanceDayQueryDto,
  ): Promise<UnmarkAttendanceDayResponseDto> {
    return this.attendanceService.unmarkDay(
      user.id_account,
      idUser,
      query.from,
      query.to,
    );
  }
}
