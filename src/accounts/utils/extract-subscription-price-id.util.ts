import type Stripe from 'stripe';

export function extractSubscriptionPriceId(
  subscription: Stripe.Subscription,
): string[] {
  const price: unknown = subscription.items?.data?.[0]?.price;
  const ids: string[] = [];

  if (typeof price === 'string' && price.length > 0) {
    ids.push(price);
    return ids;
  }

  if (typeof price === 'object' && price !== null) {
    if ('id' in price && typeof price.id === 'string' && price.id.length > 0) {
      ids.push(price.id);
    }
    if ('product' in price) {
      const product: unknown = price.product;
      if (typeof product === 'string' && product.length > 0) {
        ids.push(product);
      } else if (
        typeof product === 'object' &&
        product !== null &&
        'id' in product &&
        typeof product.id === 'string' &&
        product.id.length > 0
      ) {
        ids.push(product.id);
      }
    }
  }

  return ids;
}
