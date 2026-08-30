import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { CustomerAccessSummaryResponseDto } from './dto/customer-access-summary-response.dto';
import { EntryLogListQueryDto } from './dto/entry-log-list-query.dto';
import { EntryLogsPaginatedResponseDto } from './dto/entry-logs-paginated-response.dto';
import { KioskAccessCodeResponseDto } from './dto/kiosk-access-code-response.dto';
import { EntryLogsService } from './entry-logs.service';

@ApiTags('entry-logs')
@ApiBearerAuth()
@Controller(['entry-logs', 'access'])
@UseGuards(FeatureGuard, RolesGuard)
@RequireFeature(5010)
@Roles(UserRole.owner, UserRole.coach)
export class EntryLogsController {
  constructor(private readonly entryLogsService: EntryLogsService) {}

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
}
