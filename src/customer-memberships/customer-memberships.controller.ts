import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RequireAccess } from '../common/decorators/require-access.decorator';
import { AccessGuard } from '../common/guards/access.guard';
import { CustomerMembershipsService } from './customer-memberships.service';
import { AssignMembershipDto } from './dto/assign-membership.dto';
import { CustomerMembershipResponseDto } from './dto/customer-membership-response.dto';

@ApiTags('customer-memberships')
@ApiBearerAuth()
@Controller('customer-memberships')
export class CustomerMembershipsController {
  constructor(
    private readonly customerMembershipsService: CustomerMembershipsService,
  ) {}

  @Post('assign')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess({ roles: ['owner'], features: ['5006'] })
  @ApiOperation({ summary: 'Assign or renew a customer membership' })
  @ApiResponse({ status: 201, type: CustomerMembershipResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User or plan not found' })
  assign(@CurrentUser() user: JwtPayload, @Body() dto: AssignMembershipDto) {
    return this.customerMembershipsService.assign(user.id_account, dto);
  }
}
