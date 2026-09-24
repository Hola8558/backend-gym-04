import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Public } from '../auth/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AccountsService } from './accounts.service';
// CreateAccountDto kept for the commented manual POST /accounts route below.
// import { CreateAccountDto } from './dto/create-account.dto';
import { AccountSubscriptionResponseDto } from './dto/account-subscription-response.dto';
import { BillingPortalSessionResponseDto } from './dto/billing-portal-session-response.dto';
import { DeleteAccountTestDto } from './dto/delete-account-test.dto';
import { SoftDeleteAccountResponseDto } from './dto/soft-delete-account-response.dto';
import { StripeBillingService } from './stripe-billing.service';
import { StripeWebhookService } from './stripe-webhook.service';
import { extractStripeWebhookPayload } from './utils/extract-stripe-webhook-payload.util';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly stripeWebhookService: StripeWebhookService,
    private readonly stripeBillingService: StripeBillingService,
  ) {}

  @Get()
  findAll() {
    return { data: [], placeholder: true };
  }

  // Manual account creation disabled: accounts are created only via Stripe webhook
  // (checkout.session.completed → createAccountWithUser).
  // @Public()
  // @Post()
  // create(@Body() dto: CreateAccountDto) {
  //   return this.accountsService.createAccountWithUser(dto);
  // }

  @Public()
  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Stripe webhook for checkout.session.completed, customer.subscription.updated, and customer.subscription.deleted',
  })
  handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.stripeWebhookService.handleWebhook(
      extractStripeWebhookPayload(req),
      signature,
    );
  }

  @Get('subscription')
  @UseGuards(RolesGuard)
  @Roles(UserRole.owner, UserRole.solo_coach)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Current Stripe subscription for the authenticated account',
  })
  @ApiOkResponse({ type: AccountSubscriptionResponseDto })
  getSubscription(
    @CurrentUser() user: JwtPayload,
  ): Promise<AccountSubscriptionResponseDto> {
    return this.stripeBillingService.getAccountSubscription(user.id_account);
  }

  @Post('billing-portal')
  @UseGuards(RolesGuard)
  @Roles(UserRole.owner, UserRole.solo_coach)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a Stripe billing portal session for the authenticated account',
  })
  @ApiOkResponse({ type: BillingPortalSessionResponseDto })
  createBillingPortal(
    @CurrentUser() user: JwtPayload,
  ): Promise<BillingPortalSessionResponseDto> {
    return this.stripeBillingService.createBillingPortalSession(user.id_account);
  }

  @Public()
  @Post('delete-test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Temporary test cascade: soft-delete an account and related tenant records by id_account',
  })
  @ApiOkResponse({ type: SoftDeleteAccountResponseDto })
  deleteTest(
    @Body() dto: DeleteAccountTestDto,
  ): Promise<SoftDeleteAccountResponseDto> {
    return this.accountsService.softDeleteAccountById(dto.id_account);
  }
}
