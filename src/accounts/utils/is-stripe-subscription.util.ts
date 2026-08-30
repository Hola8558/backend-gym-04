import type Stripe from 'stripe';

export function isStripeSubscription(
  value: unknown,
): value is Stripe.Subscription {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { object?: string }).object === 'subscription'
  );
}
