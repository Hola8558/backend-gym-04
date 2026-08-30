import type Stripe from 'stripe';

export function extractCheckoutSubscriptionId(
  session: Stripe.Checkout.Session,
): string | null {
  const subscription = session.subscription;
  if (typeof subscription === 'string' && subscription.length > 0) {
    return subscription;
  }
  if (
    typeof subscription === 'object' &&
    subscription !== null &&
    'id' in subscription &&
    typeof subscription.id === 'string' &&
    subscription.id.length > 0
  ) {
    return subscription.id;
  }
  return null;
}
