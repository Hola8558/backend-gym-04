import { AccountType } from '@prisma/client';
import type { StripePriceIdCatalog } from '../types/stripe-price-id-catalog.type';

export function mapStripePriceIdToAccountType(
  stripeIds: string[],
  catalog: StripePriceIdCatalog,
): AccountType {
  const ids = new Set(stripeIds);

  if (catalog.coach && ids.has(catalog.coach)) {
    return AccountType.coach;
  }
  if (catalog.studio && ids.has(catalog.studio)) {
    return AccountType.studio;
  }
  if (catalog.pro && ids.has(catalog.pro)) {
    return AccountType.pro;
  }
  if (catalog.business && ids.has(catalog.business)) {
    return AccountType.business;
  }
  if (catalog.personalized && ids.has(catalog.personalized)) {
    return AccountType.personalized;
  }

  return AccountType.coach;
}
