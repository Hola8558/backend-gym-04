import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { AccountEmailStatusController } from './account-email-status.controller';
import { AccountsController } from './accounts.controller';
import { EmailStatusOriginGuard } from './guards/email-status-origin.guard';
import { AccountsService } from './accounts.service';
import { stripeClientProvider } from './providers/stripe-client.provider';
import { StripeBillingService } from './stripe-billing.service';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  controllers: [AccountsController, AccountEmailStatusController],
  providers: [
    AccountsService,
    stripeClientProvider,
    StripeWebhookService,
    StripeBillingService,
    RolesGuard,
    EmailStatusOriginGuard,
  ],
})
export class AccountsModule {}
