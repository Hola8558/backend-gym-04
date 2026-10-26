import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { JwtPayload } from '../../auth/jwt.strategy';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FeatureGuard } from '../../common/guards/feature.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CUSTOMER_READ_FEATURES } from '../constants/customer-read-features.const';
import { CustomersMetricsService } from './customers-metrics.service';
import { ClientMetricHistoryResponseDto } from './dto/client-metric-history-response.dto';
import { ClientMetricsResponseDto } from './dto/client-metrics-response.dto';
import { CreateClientMetricDto } from './dto/create-client-metric.dto';

@ApiTags('customers / metrics')
@ApiBearerAuth()
@Controller(['customers/:id/metrics', 'customer/:id/metrics'])
@UseGuards(RolesGuard, FeatureGuard)
@Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
@RequireFeature(...CUSTOMER_READ_FEATURES)
export class CustomersMetricsController {
  constructor(private readonly metricsService: CustomersMetricsService) {}

  @Get('history')
  @ApiOperation({ summary: 'All body-metric check-ins for a customer, newest first' })
  @ApiOkResponse({ type: ClientMetricHistoryResponseDto })
  listHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) idUser: number,
  ): Promise<ClientMetricHistoryResponseDto> {
    return this.metricsService.listHistory(user.id_account, idUser);
  }

  @Get()
  @ApiOperation({ summary: 'Latest body metrics for a customer in the current account' })
  @ApiOkResponse({ type: ClientMetricsResponseDto })
  getLatest(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) idUser: number,
  ): Promise<ClientMetricsResponseDto> {
    return this.metricsService.getLatest(user.id_account, idUser);
  }

  @Post()
  @ApiOperation({ summary: 'Store a body-metrics check-in for a customer' })
  @ApiOkResponse({ type: ClientMetricsResponseDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) idUser: number,
    @Body() dto: CreateClientMetricDto,
  ): Promise<ClientMetricsResponseDto> {
    return this.metricsService.create(user.id_account, idUser, dto);
  }

  @Patch(':idMeasure')
  @ApiOperation({ summary: 'Update a body-metric check-in. edited_at changes only when values change.' })
  @ApiOkResponse({ type: ClientMetricsResponseDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) idUser: number,
    @Param('idMeasure', ParseUUIDPipe) idMeasure: string,
    @Body() dto: CreateClientMetricDto,
  ): Promise<ClientMetricsResponseDto> {
    return this.metricsService.update(user.id_account, idUser, idMeasure, dto);
  }

  @Delete(':idMeasure')
  @ApiOperation({ summary: 'Soft-delete a body-metric check-in' })
  @ApiOkResponse({ type: ClientMetricsResponseDto })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) idUser: number,
    @Param('idMeasure', ParseUUIDPipe) idMeasure: string,
  ): Promise<ClientMetricsResponseDto> {
    return this.metricsService.softDelete(user.id_account, idUser, idMeasure);
  }
}
