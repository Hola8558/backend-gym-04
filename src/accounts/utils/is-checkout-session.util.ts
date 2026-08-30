import type Stripe from 'stripe';

export function isCheckoutSession(
  value: unknown,
): value is Stripe.Checkout.Session {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { object?: string }).object === 'checkout.session'
  );
}
