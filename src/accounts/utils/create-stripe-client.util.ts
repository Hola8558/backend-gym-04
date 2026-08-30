import Stripe = require('stripe');
import { STRIPE_API_VERSION } from '../constants/stripe-webhook.constants';

export function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: STRIPE_API_VERSION,
  } as unknown as Stripe.StripeConfig);
}
