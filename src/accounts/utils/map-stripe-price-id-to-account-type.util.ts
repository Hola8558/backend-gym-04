import { AccountType } from '@prisma/client';
import type { StripePriceIdCatalog } from '../types/stripe-price-id-catalog.type';
import { resolveKnownStripeAccountType } from './resolve-known-stripe-account-type.util';

export function mapStripePriceIdToAccountType(
  stripeIds: string[],
  catalog: StripePriceIdCatalog,
): AccountType {
  return resolveKnownStripeAccountType(stripeIds, catalog) ?? AccountType.coach;
}
