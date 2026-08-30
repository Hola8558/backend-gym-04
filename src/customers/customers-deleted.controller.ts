import { Body, Controller, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { RecoverCustomerDto } from './dto/recover-customer.dto';
import { CustomersService } from './customers.service';

/**
 * Recovery under plural `/customers` only. List uses {@link CustomersController} `GET deleted`
 * (registered before `:id` to avoid ParseIntPipe 400 on the word `deleted`).
 */
@Controller('customers')
export class CustomersDeletedController {
  constructor(private readonly customersService: CustomersService) {}

  @Patch('deleted/:id/recover')
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequireFeature(5005, 5004)
  @ApiOkResponse({ type: CustomerResponseDto })
  recover(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecoverCustomerDto,
  ) {
    return this.customersService.recoverCustomer(id, user.id_account, dto);
  }
}
