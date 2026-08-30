import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AppearanceResponseDto } from './dto/appearance-response.dto';
import { GetStyleQueryDto } from './dto/get-style-query.dto';
import { StyleResponseDto } from './dto/style-response.dto';
import { UpdateAppearanceDto } from './dto/update-appearance.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('appearance')
  @ApiOperation({ summary: 'Get appearance settings for the current account' })
  @ApiResponse({ status: 200, type: AppearanceResponseDto })
  getAppearance(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getAppearance(user.id_account);
  }

  // Full API path (no global prefix): GET http://localhost:3000/settings/style
  // Note: /api is Swagger UI only — NOT part of REST route paths.
  @Get('style')
  @ApiOperation({
    summary: 'Get white-label style (gym name, primary color, logo) for mobile',
  })
  @ApiQuery({
    name: 'logoKey',
    required: false,
    type: String,
    description: 'Locally cached logo change key',
  })
  @ApiQuery({
    name: 'colorKey',
    required: false,
    type: String,
    description: 'Locally cached primary color change key',
  })
  @ApiQuery({
    name: 'nameKey',
    required: false,
    type: String,
    description: 'Locally cached gym name change key',
  })
  @ApiResponse({ status: 200, type: StyleResponseDto })
  async getStyle(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetStyleQueryDto,
  ) {
    Logger.log('📥 Request received at /style endpoint', 'SettingsController');

    const responsePayload = await this.settingsService.getStyle(
      user.id_account,
      query,
    );

    Logger.log(
      `Sending Style Data -> Gym: ${responsePayload.gymName ?? 'unchanged'}, Color: ${responsePayload.primaryColor ?? 'unchanged'}`,
      'SettingsController',
    );
    Logger.log('📤 Sending response back to client', 'SettingsController');

    return responsePayload;
  }

  @Patch('appearance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.owner, UserRole.solo_coach)
  @ApiOperation({ summary: 'Update appearance settings for the current account' })
  @ApiResponse({ status: 200, type: AppearanceResponseDto })
  updateAppearance(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAppearanceDto,
  ) {
    return this.settingsService.updateAppearance(user.id_account, dto);
  }
}
