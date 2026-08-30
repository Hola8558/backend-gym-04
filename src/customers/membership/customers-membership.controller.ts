import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { JwtPayload } from '../../auth/jwt.strategy';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CustomersMembershipService } from './customers-membership.service';
import { MobileCustomerMembershipResponseDto } from './dto/mobile-customer-membership-response.dto';

@ApiTags('customers / membership')
@ApiBearerAuth()
@Controller(['customer/membership', 'customers/membership'])
export class CustomersMembershipController {
  constructor(
    private readonly customersMembershipService: CustomersMembershipService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.customer)
  @ApiOperation({
    summary:
      'Get the authenticated customer membership (plan + assignment dates)',
  })
  @ApiOkResponse({
    type: MobileCustomerMembershipResponseDto,
    description:
      'Membership payload, or null when solo coach has feature 5006 inactive and no row',
  })
  getMembership(
    @CurrentUser() user: JwtPayload,
  ): Promise<MobileCustomerMembershipResponseDto | null> {
    return this.customersMembershipService.getMembershipForCustomer(
      user.sub,
      user.id_account,
    );
  }
}
