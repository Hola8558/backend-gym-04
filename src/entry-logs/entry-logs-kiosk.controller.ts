import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RequireAccess } from '../common/decorators/require-access.decorator';
import { AccessGuard } from '../common/guards/access.guard';
import { ACCESS_FEATURE_CHECKIN_ID } from './constants/access-feature.constants';
import { KioskCheckinByUserDto } from './dto/kiosk-checkin-by-user.dto';
import { KioskCheckinResponseDto } from './dto/kiosk-checkin-response.dto';
import { KioskCustomerResultDto } from './dto/kiosk-customer-result.dto';
import { KioskCustomerSearchQueryDto } from './dto/kiosk-customer-search-query.dto';
import { EntryLogsKioskService } from './entry-logs-kiosk.service';

@ApiTags('entry-logs')
@ApiBearerAuth()
@Controller('entry-logs/kiosk')
@UseGuards(AccessGuard)
@RequireAccess({ features: [String(ACCESS_FEATURE_CHECKIN_ID)] })
export class EntryLogsKioskController {
  constructor(private readonly kioskService: EntryLogsKioskService) {}

  @Get('search')
  @ApiOperation({ summary: 'Kiosk customer search by name / email prefix (masked, max 5)' })
  @ApiResponse({ status: 200, type: KioskCustomerResultDto, isArray: true })
  searchCustomers(
    @CurrentUser() user: JwtPayload,
    @Query() query: KioskCustomerSearchQueryDto,
  ): Promise<KioskCustomerResultDto[]> {
    return this.kioskService.searchCustomers(user.id_account, query.q);
  }

  @Get('preview/:userNumber')
  @ApiOperation({ summary: 'Masked kiosk preview for a typed user number' })
  @ApiResponse({ status: 200, type: KioskCustomerResultDto })
  @ApiResponse({ status: 404, description: 'ENTRY_LOGS.ERRORS.USER_NOT_FOUND' })
  previewByUserNumber(
    @CurrentUser() user: JwtPayload,
    @Param('userNumber') userNumber: string,
  ): Promise<KioskCustomerResultDto> {
    return this.kioskService.previewByUserNumber(user.id_account, userNumber);
  }

  @Post('check-in')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a customer entry from a kiosk search result' })
  @ApiResponse({ status: 201, type: KioskCheckinResponseDto })
  @ApiResponse({ status: 404, description: 'ENTRY_LOGS.ERRORS.USER_NOT_FOUND' })
  checkIn(
    @CurrentUser() user: JwtPayload,
    @Body() dto: KioskCheckinByUserDto,
  ): Promise<KioskCheckinResponseDto> {
    return this.kioskService.checkInByUserId(user.id_account, dto.id_user);
  }
}
