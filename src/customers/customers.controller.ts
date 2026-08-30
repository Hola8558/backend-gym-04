import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { BanCustomerDto } from './dto/ban-customer.dto';
import { BannedCustomerResponseDto } from './dto/banned-customer-response.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { DeletedCustomerResponseDto } from './dto/deleted-customer-response.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { RecoverCustomerDto } from './dto/recover-customer.dto';
import { UnbanCustomerDto } from './dto/unban-customer.dto';
import { CustomerBanHistoryEntryDto } from './dto/customer-ban-history-entry.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { DashboardMetricsResponseDto } from './dto/dashboard-metrics-response.dto';
import { MobileCustomerLoginResponseDto } from './dto/mobile-customer-login-response.dto';
import { SyncRoutineDto } from './dto/sync-routine.dto';
import { SyncRoutineResponseDto } from './dto/sync-routine-response.dto';
import { BulkImportCustomersDto } from './dto/bulk-import-customers.dto';
import { BulkImportCustomersResponseDto } from './dto/bulk-import-customers-response.dto';
import { CustomersService } from './customers.service';
import { CustomersImportService } from './customers-import.service';
import type { DashboardSignUpHalf } from './types/dashboard-sign-up-half';
import { isValidIanaTimeZone } from '../common/utils/zoned-day-range.util';

@Controller(['customer', 'customers'])
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly customersImportService: CustomersImportService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Mobile-only customer login (identifier without password)',
  })
  @ApiOkResponse({ type: MobileCustomerLoginResponseDto })
  loginCustomer(@Body() dto: LoginCustomerDto) {
    return this.customersService.loginCustomer(dto);
  }

  @Post('sync-routine')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.customer)
  @ApiOperation({
    summary: 'Check whether a routine revision is newer than the mobile client copy',
  })
  @ApiOkResponse({ type: SyncRoutineResponseDto })
  syncRoutine(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SyncRoutineDto,
  ) {
    return this.customersService.syncRoutine(
      user.id_account,
      user.sub,
      dto,
    );
  }

  @Post('import/bulk')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequireFeature(5005, 5004)
  @ApiOperation({ summary: 'Bulk import customers from mapped spreadsheet data' })
  @ApiOkResponse({ type: BulkImportCustomersResponseDto })
  bulkImportCustomers(
    @CurrentUser() user: JwtPayload,
    @Body() dto: BulkImportCustomersDto,
  ) {
    return this.customersImportService.bulkImportCustomers(
      user.id_account,
      user.sub,
      dto,
    );
  }

  @Get()
  @UseGuards(RolesGuard, FeatureGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  @RequireFeature(5009, 5011, 5004)
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListCustomersQueryDto,
  ) {
    const search = this.mergeSearchQuery(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const listFilters = CustomersService.toListFilters(query);
    return this.customersService.findAll(
      user.id_account,
      page,
      limit,
      search,
      listFilters,
    );
  }

  @Get('dashboard/metrics')
  @UseGuards(RolesGuard, FeatureGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  @RequireFeature(5009, 5011, 5004)
  @ApiOkResponse({ type: DashboardMetricsResponseDto })
  @ApiQuery({ name: 'trend_year', required: false, type: Number })
  @ApiQuery({ name: 'trend_half', required: false, enum: [1, 2] })
  @ApiQuery({
    name: 'full_year_trend_year',
    required: false,
    type: Number,
    description: 'Calendar year (UTC) for the 12-month annual sign-up trend (`sign_up_trend_full_year`).',
  })
  @ApiQuery({
    name: 'crowdmeter_timezone',
    required: false,
    type: String,
    description:
      'IANA time zone (e.g. Europe/Madrid) for attendances_today and access_crowdmeter_today. Defaults to UTC.',
  })
  getDashboardMetrics(
    @CurrentUser() user: JwtPayload,
    @Query('trend_year') trendYearRaw?: string,
    @Query('trend_half') trendHalfRaw?: string,
    @Query('full_year_trend_year') fullYearTrendYearRaw?: string,
    @Query('crowdmeter_timezone') crowdmeterTimezoneRaw?: string,
  ) {
    const trendView = this.parseSignUpTrendView(trendYearRaw, trendHalfRaw);
    const fullYearTrendYear = this.parseFullYearTrendYear(fullYearTrendYearRaw);
    const crowdmeterTimezone = (crowdmeterTimezoneRaw ?? 'UTC').trim();
    if (!isValidIanaTimeZone(crowdmeterTimezone)) {
      throw new BadRequestException('CUSTOMERS.ERRORS.INVALID_CROWDMETER_TIMEZONE');
    }
    return this.customersService.getDashboardMetrics(
      user,
      trendView,
      fullYearTrendYear,
      crowdmeterTimezone,
    );
  }

  @Get('search')
  @UseGuards(RolesGuard, FeatureGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  @RequireFeature(5009, 5011, 5004)
  search(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListCustomersQueryDto,
  ) {
    const search = this.mergeSearchQuery(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const listFilters = CustomersService.toListFilters(query);
    return this.customersService.searchCustomers(
      search,
      user.id_account,
      page,
      limit,
      listFilters,
    );
  }

  /** Must be registered before `@Get(':id')` or `deleted` is parsed as an integer id (400). */
  @Get('deleted')
  @UseGuards(RolesGuard, FeatureGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  @RequireFeature(5009, 5011, 5004)
  @ApiOkResponse({ type: DeletedCustomerResponseDto, isArray: true })
  findDeleted(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search = '',
    @Query('membershipTypeId') membershipTypeIdRaw?: string,
  ) {
    const membershipTypeId = this.parseOptionalPositiveInt(membershipTypeIdRaw);
    return this.customersService.findDeleted(
      user.id_account,
      Number(page),
      Number(limit),
      search,
      membershipTypeId,
    );
  }

  /** Must be registered before `@Get(':id')`. */
  @Get('banned')
  @UseGuards(RolesGuard, FeatureGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  @RequireFeature(5009, 5011, 5004)
  @ApiOkResponse({ type: BannedCustomerResponseDto })
  findBanned(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search = '',
  ) {
    return this.customersService.findBanned(
      user.id_account,
      Number(page),
      Number(limit),
      search,
    );
  }

  /** Must be registered before `@Get(':id')` or the path is parsed as a single `id` param. */
  @Get(':id/ban-history')
  @UseGuards(RolesGuard, FeatureGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  @RequireFeature(5009, 5011, 5004)
  @ApiOkResponse({ type: CustomerBanHistoryEntryDto, isArray: true })
  getBanHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.getCustomerBanHistory(id, user.id_account);
  }

  @Get(':id')
  @UseGuards(RolesGuard, FeatureGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  @RequireFeature(5009, 5011, 5004)
  @ApiOkResponse({ type: CustomerResponseDto })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.findOne(id, user.id_account);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequireFeature(5005, 5004)
  @ApiOkResponse({ type: CustomerResponseDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.customersService.update(id, user.id_account, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequireFeature(5005, 5004)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.remove(id, user.id_account, user.sub);
  }

  @Post(':id/ban')
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequireFeature(5005, 5004)
  @ApiOkResponse({ type: CustomerResponseDto })
  ban(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BanCustomerDto,
  ) {
    return this.customersService.banCustomer(id, user.id_account, user.sub, dto);
  }

  @Patch(':id/unban')
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequireFeature(5005, 5004)
  @ApiOkResponse({ type: CustomerResponseDto })
  unban(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UnbanCustomerDto,
  ) {
    return this.customersService.unbanCustomer(
      id,
      user.id_account,
      user.sub,
      dto,
    );
  }

  private parseSignUpTrendView(
    trendYearRaw?: string,
    trendHalfRaw?: string,
  ): { year: number; half: DashboardSignUpHalf } {
    const now = new Date();
    const defaultYear = now.getUTCFullYear();
    const defaultHalf: DashboardSignUpHalf = now.getUTCMonth() < 6 ? 1 : 2;
    if (
      trendYearRaw == null ||
      trendYearRaw === '' ||
      trendHalfRaw == null ||
      trendHalfRaw === ''
    ) {
      return { year: defaultYear, half: defaultHalf };
    }
    const year = Math.floor(Number(trendYearRaw));
    if (!Number.isInteger(year) || year < 1970 || year > 2100) {
      throw new BadRequestException('CUSTOMERS.ERRORS.INVALID_TREND_PARAMS');
    }
    if (trendHalfRaw !== '1' && trendHalfRaw !== '2') {
      throw new BadRequestException('CUSTOMERS.ERRORS.INVALID_TREND_PARAMS');
    }
    const half: DashboardSignUpHalf = trendHalfRaw === '2' ? 2 : 1;
    return { year, half };
  }

  private parseFullYearTrendYear(raw?: string): number {
    const now = new Date();
    const defaultYear = now.getUTCFullYear();
    if (raw == null || raw === '') {
      return defaultYear;
    }
    const year = Math.floor(Number(raw));
    if (!Number.isInteger(year) || year < 1970 || year > 2100) {
      throw new BadRequestException('CUSTOMERS.ERRORS.INVALID_TREND_PARAMS');
    }
    return year;
  }

  private mergeSearchQuery(query: ListCustomersQueryDto): string {
    const a = (query.search ?? '').trim();
    const b = (query.q ?? '').trim();
    return a || b;
  }

  private parseOptionalPositiveInt(raw?: string): number | undefined {
    if (raw === undefined || raw === null || raw === '') {
      return undefined;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) {
      return undefined;
    }
    return Math.floor(n);
  }
}
