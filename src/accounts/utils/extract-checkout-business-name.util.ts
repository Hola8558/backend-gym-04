import type Stripe from 'stripe';

export function extractCheckoutBusinessName(
  session: Stripe.Checkout.Session,
): string | null {
  const fields = session.custom_fields ?? [];
  for (const field of fields) {
    const value = field.text?.value?.trim();
    if (field.type === 'text' && value) {
      return value;
    }
  }
  return null;
}
