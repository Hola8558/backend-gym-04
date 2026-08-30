import { plainToInstance } from 'class-transformer';
import type Stripe from 'stripe';
import { AccountSubscriptionResponseDto } from '../dto/account-subscription-response.dto';
import { summarizeStripeDiscount } from './summarize-stripe-discount.util';
import { unixSecondsToIso } from './unix-seconds-to-iso.util';

export function toAccountSubscriptionResponseDto(
  subscription: Stripe.Subscription,
): AccountSubscriptionResponseDto {
  const item = subscription.items?.data?.[0];
  const price = item?.price;
  const periodStart =
    unixSecondsToIso(readNumber(subscription, 'current_period_start')) ??
    unixSecondsToIso(readNumber(item, 'current_period_start'));
  const periodEnd =
    unixSecondsToIso(readNumber(subscription, 'current_period_end')) ??
    unixSecondsToIso(readNumber(item, 'current_period_end'));

  return plainToInstance(
    AccountSubscriptionResponseDto,
    {
      status: subscription.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      amount: price?.unit_amount ?? null,
      currency: price?.currency ?? subscription.currency ?? null,
      interval: price?.recurring?.interval ?? null,
      interval_count: price?.recurring?.interval_count ?? null,
      quantity: item?.quantity ?? null,
      product: resolveProductName(price?.product),
      discount: resolveDiscount(subscription),
      cancel_at_period_end: subscription.cancel_at_period_end === true,
      collection_method: subscription.collection_method ?? null,
      created: unixSecondsToIso(subscription.created),
      trial_end: unixSecondsToIso(subscription.trial_end),
      canceled_at: unixSecondsToIso(subscription.canceled_at),
      ended_at: unixSecondsToIso(subscription.ended_at),
      cancel_at: unixSecondsToIso(subscription.cancel_at),
    },
    { excludeExtraneousValues: true },
  );
}

function readNumber(source: unknown, key: string): number | null {
  if (typeof source !== 'object' || source === null || !(key in source)) {
    return null;
  }
  const value = (source as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function resolveProductName(product: Stripe.Price['product'] | undefined): string | null {
  if (typeof product === 'string' && product.length > 0) {
    return product;
  }
  if (
    typeof product === 'object' &&
    product !== null &&
    'deleted' in product &&
    product.deleted === true
  ) {
    return null;
  }
  if (typeof product === 'object' && product !== null && 'name' in product) {
    const name = product.name;
    return typeof name === 'string' && name.trim() !== '' ? name.trim() : product.id;
  }
  return null;
}

function resolveDiscount(subscription: Stripe.Subscription): string | null {
  const legacy = summarizeStripeDiscount(
    (subscription as Stripe.Subscription & { discount?: unknown }).discount,
  );
  if (legacy) {
    return legacy;
  }
  const discounts = (
    subscription as Stripe.Subscription & { discounts?: unknown }
  ).discounts;
  if (!Array.isArray(discounts) || discounts.length === 0) {
    return null;
  }
  const first = discounts[0];
  if (typeof first === 'string') {
    return first;
  }
  return summarizeStripeDiscount(first);
}
