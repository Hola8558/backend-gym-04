export function summarizeStripeDiscount(discount: unknown): string | null {
  if (typeof discount !== 'object' || discount === null) {
    return null;
  }
  if (!('coupon' in discount) || typeof discount.coupon !== 'object' || discount.coupon === null) {
    return null;
  }
  const coupon = discount.coupon as {
    name?: unknown;
    percent_off?: unknown;
    amount_off?: unknown;
    currency?: unknown;
  };
  if (typeof coupon.percent_off === 'number') {
    return `${coupon.percent_off}%`;
  }
  if (typeof coupon.amount_off === 'number') {
    const currency =
      typeof coupon.currency === 'string' ? coupon.currency.toUpperCase() : '';
    return `${(coupon.amount_off / 100).toFixed(2)} ${currency}`.trim();
  }
  if (typeof coupon.name === 'string' && coupon.name.trim() !== '') {
    return coupon.name.trim();
  }
  return null;
}
