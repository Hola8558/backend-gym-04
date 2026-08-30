import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { isAllowedEmailStatusOrigin } from '../utils/is-allowed-email-status-origin.util';

@Injectable()
export class EmailStatusOriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.headers.origin;
    const referer = request.headers.referer;
    if (
      !isAllowedEmailStatusOrigin(
        typeof origin === 'string' ? origin : undefined,
        typeof referer === 'string' ? referer : undefined,
      )
    ) {
      throw new ForbiddenException('ACCOUNT.ERRORS.VALIDATION_FAILED');
    }
    return true;
  }
}
