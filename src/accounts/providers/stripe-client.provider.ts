import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createStripeClient } from '../utils/create-stripe-client.util';

export const STRIPE_CLIENT = 'STRIPE_CLIENT';

export const stripeClientProvider: Provider = {
  provide: STRIPE_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const apiKey = config.get<string>('STRIPE_SECRET_KEY')?.trim();
    if (!apiKey) {
      throw new Error('STRIPE.ERRORS.SECRET_KEY_MISSING');
    }
    return createStripeClient(apiKey);
  },
};

