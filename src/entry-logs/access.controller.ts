import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ManualCheckinDto } from './dto/manual-checkin.dto';
import { ManualCheckinResponseDto } from './dto/manual-checkin-response.dto';
import { FeatureCheckinResponseDto } from './dto/feature-checkin-response.dto';
import { AccessService } from './access.service';
import { EntryLogsService } from './entry-logs.service';

@ApiTags('access')
@ApiBearerAuth()
@Controller('access')
export class AccessController {
  constructor(
    private readonly accessService: AccessService,
    private readonly entryLogsService: EntryLogsService,
  ) {}

  @Get('feature-checkin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.customer)
  @ApiOperation({
    summary: 'Whether check-in feature (5001) is enabled for the customer gym account',
  })
  @ApiResponse({ status: 200, type: FeatureCheckinResponseDto })
  async checkFeature(
    @CurrentUser() user: JwtPayload,
    @Query('userNumber') userNumber?: string,
  ): Promise<{ success: true; isEnabled: boolean }> {
    const resolvedUserNumber =
      userNumber?.trim() ||
      (await this.accessService.resolveCustomerUserNumber(user));

    const isEnabled = await this.accessService.isCheckinFeatureEnabled(
      resolvedUserNumber,
    );

    return {
      success: true,
      isEnabled,
    };
  }

  @Post('manual-checkin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.customer)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mobile customer manual check-in using daily access code',
  })
  @ApiResponse({ status: 200, type: ManualCheckinResponseDto })
  @ApiResponse({ status: 401, description: 'ACCESS.ERRORS.INVALID_ACCESS_CODE' })
  manualCheckin(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ManualCheckinDto,
  ): Promise<ManualCheckinResponseDto> {
    return this.entryLogsService.manualCheckin(user, dto);
  }
}
