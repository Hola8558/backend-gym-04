import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';
import { PrismaService } from '../core/prisma/prisma.service';
import { AccountSubscriptionResponseDto } from './dto/account-subscription-response.dto';
import { BillingPortalSessionResponseDto } from './dto/billing-portal-session-response.dto';
import { STRIPE_CLIENT } from './providers/stripe-client.provider';
import { PREFERRED_STRIPE_SUBSCRIPTION_STATUSES } from './constants/preferred-stripe-subscription-statuses.const';
import { toAccountSubscriptionResponseDto } from './utils/to-account-subscription-response.mapper';

@Injectable()
export class StripeBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
  ) {}

  async getAccountSubscription(
    idAccount: number,
  ): Promise<AccountSubscriptionResponseDto> {
    const customerId = await this.requireStripeCustomerId(idAccount);
    const page = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });
    const picked = this.pickSubscription(page.data);
    if (!picked) {
      throw new NotFoundException('STRIPE.ERRORS.SUBSCRIPTION_NOT_FOUND');
    }
    const subscription = await this.stripe.subscriptions.retrieve(picked.id, {
      expand: ['items.data.price.product'],
    });
    return toAccountSubscriptionResponseDto(subscription);
  }

  async createBillingPortalSession(
    idAccount: number,
  ): Promise<BillingPortalSessionResponseDto> {
    const customerId = await this.requireStripeCustomerId(idAccount);
    const returnUrl = this.configService
      .get<string>('STRIPE_BILLING_PORTAL_RETURN_URL')
      ?.trim();
    if (!returnUrl) {
      throw new InternalServerErrorException(
        'STRIPE.ERRORS.RETURN_URL_MISSING',
      );
    }
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    if (!session.url) {
      throw new InternalServerErrorException(
        'STRIPE.ERRORS.BILLING_PORTAL_FAILED',
      );
    }
    return { url: session.url };
  }

  async createBillingPortalUrlOrNull(idAccount: number): Promise<string | null> {
    try {
      const session = await this.createBillingPortalSession(idAccount);
      return session.url;
    } catch {
      return null;
    }
  }

  private async requireStripeCustomerId(idAccount: number): Promise<string> {
    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount },
      select: { stripeCustomerId: true },
    });
    const customerId = detail?.stripeCustomerId?.trim();
    if (!customerId) {
      throw new NotFoundException('STRIPE.ERRORS.CUSTOMER_NOT_LINKED');
    }
    return customerId;
  }

  private pickSubscription(
    subscriptions: Stripe.Subscription[],
  ): Stripe.Subscription | undefined {
    const preferred = subscriptions.find((row) =>
      PREFERRED_STRIPE_SUBSCRIPTION_STATUSES.has(row.status),
    );
    return preferred ?? subscriptions[0];
  }
}
