import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

export function extractStripeWebhookPayload(
  req: RawBodyRequest<Request>,
): Buffer | undefined {
  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (Buffer.isBuffer(req.rawBody)) {
    return req.rawBody;
  }
  return undefined;
}
