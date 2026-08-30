import type Stripe from 'stripe';

export function extractCheckoutCustomerEmail(
  session: Stripe.Checkout.Session,
): string | null {
  const email = session.customer_details?.email?.trim();
  return email ? email : null;
}
