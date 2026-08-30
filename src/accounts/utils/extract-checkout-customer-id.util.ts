import type Stripe from 'stripe';

export function extractCheckoutCustomerId(
  session: Stripe.Checkout.Session,
): string | null {
  const customer = session.customer;
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
