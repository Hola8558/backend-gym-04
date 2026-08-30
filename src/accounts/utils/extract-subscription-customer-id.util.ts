import type Stripe from 'stripe';

export function extractSubscriptionCustomerId(
  subscription: Stripe.Subscription,
): string | null {
  const customer = subscription.customer;
  if (typeof customer === 'string' && customer.length > 0) {
    return customer;
  }
  if (
    typeof customer === 'object' &&
    customer !== null &&
    'id' in customer &&
    typeof customer.id === 'string' &&
    customer.id.length > 0
  ) {
    return customer.id;
  }
  return null;
}
