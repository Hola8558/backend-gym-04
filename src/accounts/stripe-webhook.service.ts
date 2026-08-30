import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenericStatus } from '@prisma/client';
import type Stripe from 'stripe';
import { AccountsService } from './accounts.service';
import { STRIPE_CLIENT } from './providers/stripe-client.provider';
import {
  STRIPE_EVENT_CHECKOUT_SESSION_COMPLETED,
  STRIPE_EVENT_CUSTOMER_SUBSCRIPTION_DELETED,
  STRIPE_EVENT_CUSTOMER_SUBSCRIPTION_UPDATED,
} from './constants/stripe-webhook.constants';
import type { StripeWebhookReceived } from './types/stripe-webhook-received.type';
import { constructStripeWebhookEvent } from './utils/construct-stripe-webhook-event.util';
import { extractCheckoutBusinessName } from './utils/extract-checkout-business-name.util';
import { extractCheckoutCustomerEmail } from './utils/extract-checkout-customer-email.util';
import { extractCheckoutCustomerId } from './utils/extract-checkout-customer-id.util';
import { extractCheckoutSubscriptionId } from './utils/extract-checkout-subscription-id.util';
import { extractSubscriptionCustomerId } from './utils/extract-subscription-customer-id.util';
import { extractSubscriptionPriceId } from './utils/extract-subscription-price-id.util';
import { isCheckoutSession } from './utils/is-checkout-session.util';
import { isStripeSubscription } from './utils/is-stripe-subscription.util';
import { mapStripePriceIdToAccountType } from './utils/map-stripe-price-id-to-account-type.util';
import { mapStripeSubscriptionStatusToAccountStatus } from './utils/map-stripe-subscription-status-to-account-status.util';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly accountsService: AccountsService,
  ) {}

  async handleWebhook(
    payload: Buffer | undefined,
    signature: string | undefined,
  ): Promise<StripeWebhookReceived> {
    const event = this.verifyStripeEvent(payload, signature);
    return this.handleEvent(event);
  }

  async handleEvent(event: Stripe.Event): Promise<StripeWebhookReceived> {
    console.log(event);
    switch (event.type) {
      case STRIPE_EVENT_CHECKOUT_SESSION_COMPLETED:
        await this.handleCheckoutSessionCompleted(event);
        break;
      case STRIPE_EVENT_CUSTOMER_SUBSCRIPTION_UPDATED:
        await this.handleCustomerSubscriptionUpdated(event);
        break;
      case STRIPE_EVENT_CUSTOMER_SUBSCRIPTION_DELETED:
        await this.handleCustomerSubscriptionDeleted(event);
        break;
      default:
        this.logger.log(`Stripe webhook ignored: ${event.type}`);
    }

    return { received: true };
  }

  async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
    this.logReceivedData(STRIPE_EVENT_CHECKOUT_SESSION_COMPLETED, event);

    if (!isCheckoutSession(event.data.object)) {
      throw new BadRequestException('STRIPE.ERRORS.INVALID_CHECKOUT_SESSION');
    }

    const session = event.data.object;
    const name = extractCheckoutBusinessName(session);
    const email = extractCheckoutCustomerEmail(session);
    const subscriptionId = extractCheckoutSubscriptionId(session);
    const stripeCustomerId = extractCheckoutCustomerId(session);

    if (!name) {
      throw new BadRequestException('STRIPE.ERRORS.MISSING_CHECKOUT_NAME');
    }
    if (!email) {
      throw new BadRequestException('STRIPE.ERRORS.MISSING_CHECKOUT_EMAIL');
    }
    if (!subscriptionId) {
      throw new BadRequestException('STRIPE.ERRORS.MISSING_SUBSCRIPTION');
    }
    if (!stripeCustomerId) {
      throw new BadRequestException('STRIPE.ERRORS.MISSING_CUSTOMER');
    }

    const existingIdAccounts =
      await this.accountsService.findIdAccountsByStripeCustomerId(
        stripeCustomerId,
      );
    if (existingIdAccounts.length > 0) {
      this.logger.log(
        `Stripe checkout completed ignored; customer already linked to account(s) ${existingIdAccounts.join(', ')}: ${stripeCustomerId}`,
      );
      return;
    }

    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    const type = mapStripePriceIdToAccountType(
      extractSubscriptionPriceId(subscription),
      {
        coach: this.configService.get<string>('STRIPE_PRICE_ID_COACH')?.trim(),
        studio: this.configService.get<string>('STRIPE_PRICE_ID_STUDIO')?.trim(),
        pro: this.configService.get<string>('STRIPE_PRICE_ID_PRO')?.trim(),
        business: this.configService
          .get<string>('STRIPE_PRICE_ID_BUSINESS')
          ?.trim(),
        personalized: this.configService
          .get<string>('STRIPE_PRICE_ID_PERSONALIZED')
          ?.trim(),
      },
    );

    await this.accountsService.createAccountWithUser({
      name,
      type,
      email,
      password: null,
      requiresPasswordChange: true,
      stripeCustomerId,
    });
  }

  async handleCustomerSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    this.logReceivedData(STRIPE_EVENT_CUSTOMER_SUBSCRIPTION_UPDATED, event);

    if (!isStripeSubscription(event.data.object)) {
      throw new BadRequestException('STRIPE.ERRORS.INVALID_SUBSCRIPTION');
    }

    const accountStatus = mapStripeSubscriptionStatusToAccountStatus(
      event.data.object.status,
    );
    if (!accountStatus) {
      return;
    }

    await this.applyAccountStatusFromStripeSubscription(
      event.data.object,
      accountStatus,
    );
  }

  async handleCustomerSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    this.logReceivedData(STRIPE_EVENT_CUSTOMER_SUBSCRIPTION_DELETED, event);

    if (!isStripeSubscription(event.data.object)) {
      throw new BadRequestException('STRIPE.ERRORS.INVALID_SUBSCRIPTION');
    }

    await this.applyAccountStatusFromStripeSubscription(
      event.data.object,
      GenericStatus.inactive,
    );
  }

  private async applyAccountStatusFromStripeSubscription(
    subscription: Stripe.Subscription,
    status: GenericStatus,
  ): Promise<void> {
    const stripeCustomerId = extractSubscriptionCustomerId(subscription);
    if (!stripeCustomerId) {
      throw new BadRequestException('STRIPE.ERRORS.MISSING_CUSTOMER');
    }

    const updated = await this.accountsService.setStatusByStripeCustomerId(
      stripeCustomerId,
      status,
    );
    if (updated === 0) {
      this.logger.log(
        `Stripe subscription sync skipped; no account for customer ${stripeCustomerId}`,
      );
    }
  }

  private verifyStripeEvent(
    payload: Buffer | undefined,
    signature: string | undefined,
  ): Stripe.Event {
    const secret = this.configService
      .get<string>('STRIPE_WEBHOOK_SECRET')
      ?.trim();
    if (!secret) {
      throw new InternalServerErrorException(
        'STRIPE.ERRORS.WEBHOOK_SECRET_MISSING',
      );
    }
    if (!signature) {
      throw new BadRequestException('STRIPE.ERRORS.MISSING_SIGNATURE');
    }
    if (!payload) {
      throw new InternalServerErrorException('STRIPE.ERRORS.MISSING_RAW_BODY');
    }

    try {
      return constructStripeWebhookEvent(
        this.stripe,
        payload,
        signature,
        secret,
      );
    } catch (error) {
      this.logger.error(
        `Stripe signature verification failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new BadRequestException('STRIPE.ERRORS.INVALID_SIGNATURE');
    }
  }

  private logReceivedData(eventType: string, event: Stripe.Event): void {
    this.logger.log(
      `Stripe ${eventType} webhook payload: ${JSON.stringify(event, null, 2)}`,
    );
  }
}
