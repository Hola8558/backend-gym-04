import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CustomersService } from '../customers/customers.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { DashboardSignUpTrendPointDto } from '../customers/dto/dashboard-sign-up-trend-point.dto';
import { CoachDashboardMetricsResponseDto } from './dto/coach-dashboard-metrics-response.dto';
import { SoloCoachDashboardMetricsResponseDto } from './dto/solo-coach-dashboard-metrics-response.dto';
import type { DashboardSignUpHalf } from '../customers/types/dashboard-sign-up-half';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(RolesGuard)
@Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly customersService: CustomersService,
  ) {}

  @Get('annual-trend')
  @ApiOkResponse({ type: DashboardSignUpTrendPointDto, isArray: true })
  @ApiQuery({ name: 'year', required: true, type: Number, description: 'Calendar year (UTC), e.g. 2025.' })
  async getAnnualTrend(
    @CurrentUser() user: JwtPayload,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<DashboardSignUpTrendPointDto[]> {
    if (!Number.isFinite(year) || year < 1970 || year > 2100) {
      throw new BadRequestException('DASHBOARD.ERRORS.INVALID_ANNUAL_TREND_YEAR');
    }
    return this.dashboardService.getAnnualSignUpTrend(user.id_account, year);
  }

  @Get('renewal-trend')
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { type: 'integer' },
      minItems: 6,
      maxItems: 6,
      description: 'Six renewal counts for the UTC semester (H1: Jan–Jun or H2: Jul–Dec), oldest month first.',
    },
  })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({
    name: 'half',
    required: true,
    enum: [1, 2],
    description: '1 = Jan–Jun, 2 = Jul–Dec (UTC calendar months).',
  })
  async getRenewalTrend(
    @CurrentUser() user: JwtPayload,
    @Query('year', ParseIntPipe) year: number,
    @Query('half', ParseIntPipe) half: number,
  ): Promise<number[]> {
    if (!Number.isFinite(year) || year < 1970 || year > 2100) {
      throw new BadRequestException('DASHBOARD.ERRORS.INVALID_RENEWAL_TREND_YEAR');
    }
    if (half !== 1 && half !== 2) {
      throw new BadRequestException('DASHBOARD.ERRORS.INVALID_RENEWAL_TREND_HALF');
    }
    const canRenewals = await this.customersService.canUserViewDashboardMembershipMetrics(user);
    if (!canRenewals) {
      throw new ForbiddenException('SECURITY.ERRORS.ACCESS_DENIED');
    }
    return this.dashboardService.getRenewalTrendCounts(user.id_account, year, half as DashboardSignUpHalf);
  }

  @Get('coach-metrics')
  @Roles(UserRole.coach, UserRole.solo_coach)
  @ApiOkResponse({ type: CoachDashboardMetricsResponseDto })
  @ApiQuery({
    name: 'crowdmeter_timezone',
    required: false,
    description:
      "IANA time zone id for today's attendances and crowdmeter buckets (defaults to UTC).",
  })
  getCoachMetrics(
    @CurrentUser() user: JwtPayload,
    @Query('crowdmeter_timezone') crowdmeterTimezone?: string,
  ): Promise<CoachDashboardMetricsResponseDto> {
    const tz = (crowdmeterTimezone ?? 'UTC').trim() || 'UTC';
    return this.dashboardService.getCoachMetrics(user, tz);
  }

  @Get('solo-coach-metrics')
  @Roles(UserRole.solo_coach)
  @ApiOkResponse({ type: SoloCoachDashboardMetricsResponseDto })
  @ApiQuery({ name: 'trend_year', required: false, type: Number })
  @ApiQuery({ name: 'trend_half', required: false, enum: [1, 2] })
  @ApiQuery({
    name: 'full_year_trend_year',
    required: false,
    type: Number,
    description: 'Calendar year (UTC) for the 12-month sign-up trend.',
  })
  getSoloCoachMetrics(
    @CurrentUser() user: JwtPayload,
    @Query('trend_year') trendYearRaw?: string,
    @Query('trend_half') trendHalfRaw?: string,
    @Query('full_year_trend_year') fullYearTrendYearRaw?: string,
  ): Promise<SoloCoachDashboardMetricsResponseDto> {
    const trendView = this.parseSignUpTrendView(trendYearRaw, trendHalfRaw);
    const fullYearTrendYear = this.parseFullYearTrendYear(fullYearTrendYearRaw);
    return this.dashboardService.getSoloCoachDashboardMetrics(
      user,
      trendView,
      fullYearTrendYear,
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
}
