import { GenericStatus } from '@prisma/client';
import {
  STRIPE_SUBSCRIPTION_STATUS_ACTIVE,
  STRIPE_SUBSCRIPTION_STATUS_UNPAID,
} from '../constants/stripe-webhook.constants';

export function mapStripeSubscriptionStatusToAccountStatus(
  status: string,
): GenericStatus | null {
  if (status === STRIPE_SUBSCRIPTION_STATUS_UNPAID) {
    return GenericStatus.inactive;
  }
  if (status === STRIPE_SUBSCRIPTION_STATUS_ACTIVE) {
    return GenericStatus.active;
  }
  return null;
}
