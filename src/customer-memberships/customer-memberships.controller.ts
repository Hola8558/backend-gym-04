import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CustomerMembershipsService } from './customer-memberships.service';
import { AssignMembershipDto } from './dto/assign-membership.dto';
import { CustomerMembershipResponseDto } from './dto/customer-membership-response.dto';

@ApiTags('customer-memberships')
@ApiBearerAuth()
@Controller('customer-memberships')
@UseGuards(RolesGuard)
export class CustomerMembershipsController {
  constructor(
    private readonly customerMembershipsService: CustomerMembershipsService,
  ) {}

  @Post('assign')
  @Roles(UserRole.owner, UserRole.coach)
  @ApiOperation({ summary: 'Assign or renew a customer membership' })
  @ApiResponse({ status: 201, type: CustomerMembershipResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User or plan not found' })
  assign(@CurrentUser() user: JwtPayload, @Body() dto: AssignMembershipDto) {
    return this.customerMembershipsService.assign(user.id_account, dto);
  }
}
