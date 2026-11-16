import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { ACCOUNT_PROVISION_HEADER } from '../constants/account-provision.constants';
import { accountProvisionSecretMatches } from '../utils/account-provision-secret-matches.util';

@Injectable()
export class AccountProvisionGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers[ACCOUNT_PROVISION_HEADER];
    const provided = typeof header === 'string' ? header : undefined;
    const configured = this.configService.get<string>(
      'ACCOUNT_PROVISION_SECRET',
    );

    if (!accountProvisionSecretMatches(configured, provided)) {
      throw new NotFoundException('ACCOUNTS.ERRORS.NOT_FOUND');
    }

    return true;
  }
}
