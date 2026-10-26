import { Controller, Get, UseGuards } from '@nestjs/common';
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
import { MetricCatalogResponseDto } from './dto/metric-catalog-response.dto';

@ApiTags('customers / metrics')
@ApiBearerAuth()
@Controller('customers/metrics')
@UseGuards(RolesGuard, FeatureGuard)
@Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
@RequireFeature(...CUSTOMER_READ_FEATURES)
export class CustomersMetricsCatalogController {
  constructor(private readonly metricsService: CustomersMetricsService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Body-metric fields for the current account, without a customer' })
  @ApiOkResponse({ type: MetricCatalogResponseDto })
  getCatalog(@CurrentUser() user: JwtPayload): Promise<MetricCatalogResponseDto> {
    return this.metricsService.getCatalog(user.id_account);
  }
}
