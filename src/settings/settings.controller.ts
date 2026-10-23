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
import { MandatoryFieldsResponseDto } from './dto/mandatory-fields-response.dto';
import { StyleResponseDto } from './dto/style-response.dto';
import { UpdateAppearanceDto } from './dto/update-appearance.dto';
import { UpdateMandatoryFieldsDto } from './dto/update-mandatory-fields.dto';
import { HealthPreferencesResponseDto } from './dto/health-preferences-response.dto';
import { UpdateHealthPreferencesDto } from './dto/update-health-preferences.dto';
import { QuickAccessResponseDto } from './dto/quick-access-response.dto';
import { QuickAccessShortcutsResponseDto } from './dto/quick-access-shortcuts-response.dto';
import { UpdateQuickAccessDto } from './dto/update-quick-access.dto';
import { QuickAccessService } from './quick-access.service';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly quickAccessService: QuickAccessService,
  ) {}

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

  @Get('mandatory-fields')
  @ApiOperation({
    summary: 'Customer form fields that are mandatory for the current account',
  })
  @ApiResponse({ status: 200, type: MandatoryFieldsResponseDto })
  getMandatoryFields(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getMandatoryFields(user.id_account);
  }

  @Patch('mandatory-fields')
  @UseGuards(RolesGuard)
  @Roles(UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary: 'Replace the mandatory customer form fields for the current account',
  })
  @ApiResponse({ status: 200, type: MandatoryFieldsResponseDto })
  updateMandatoryFields(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMandatoryFieldsDto,
  ) {
    return this.settingsService.updateMandatoryFields(
      user.id_account,
      user.sub,
      dto,
    );
  }

  @Get('health-preferences')
  @ApiOperation({
    summary: 'Health and preference lists configured for the current account',
  })
  @ApiResponse({ status: 200, type: HealthPreferencesResponseDto })
  getHealthPreferences(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getHealthPreferences(user.id_account);
  }

  @Patch('health-preferences')
  @UseGuards(RolesGuard)
  @Roles(UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary: 'Add, rename, soft-delete, or restore an account health list',
  })
  @ApiResponse({ status: 200, type: HealthPreferencesResponseDto })
  updateHealthPreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateHealthPreferencesDto,
  ) {
    return this.settingsService.updateHealthPreferences(
      user.id_account,
      user.sub,
      dto,
    );
  }

  @Get('quick-access/shortcuts')
  @ApiOperation({
    summary: 'Global quick-access shortcuts for the current account, in display order',
  })
  @ApiResponse({ status: 200, type: QuickAccessShortcutsResponseDto })
  getQuickAccessShortcuts(@CurrentUser() user: JwtPayload) {
    return this.quickAccessService.listShortcuts(user.id_account);
  }

  @Get('quick-access')
  @ApiOperation({
    summary: 'Saved quick filters for one table view of the current account',
  })
  @ApiQuery({ name: 'view', required: true, example: 'customers.active' })
  @ApiResponse({ status: 200, type: QuickAccessResponseDto })
  getQuickAccess(
    @CurrentUser() user: JwtPayload,
    @Query('view') view = '',
  ) {
    return this.quickAccessService.list(user.id_account, view);
  }

  @Patch('quick-access')
  @UseGuards(RolesGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  @ApiOperation({
    summary: 'Add or remove a saved quick filter for a table view',
  })
  @ApiResponse({ status: 200, type: QuickAccessResponseDto })
  updateQuickAccess(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateQuickAccessDto,
  ) {
    return this.quickAccessService.update(user.id_account, dto);
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
