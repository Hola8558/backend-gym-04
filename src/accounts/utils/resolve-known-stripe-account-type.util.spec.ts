import { AccountType } from '@prisma/client';
import { mapStripePriceIdToAccountType } from './map-stripe-price-id-to-account-type.util';
import { resolveKnownStripeAccountType } from './resolve-known-stripe-account-type.util';

const catalog = {
  coach: 'price_coach',
  studio: 'price_studio',
  pro: 'price_pro',
  business: 'price_business',
  personalized: 'price_personalized',
};

describe('resolveKnownStripeAccountType', () => {
  it('returns the plan that matches the Stripe price', () => {
    expect(resolveKnownStripeAccountType(['price_pro'], catalog)).toBe(
      AccountType.pro,
    );
  });

  it('returns null when the price is not in the catalog', () => {
    expect(resolveKnownStripeAccountType(['price_other'], catalog)).toBeNull();
  });
});

describe('mapStripePriceIdToAccountType', () => {
  it('falls back to coach when the price is unknown', () => {
    expect(mapStripePriceIdToAccountType(['price_other'], catalog)).toBe(
      AccountType.coach,
    );
  });
});
