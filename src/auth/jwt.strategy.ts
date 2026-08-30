import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AccountType, UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../core/prisma/prisma.service';
import { assertActiveJwtSession } from './utils/assert-active-jwt-session.util';

/** Shape of JWT claims produced by AuthService.login (plus standard iat/exp). */
export interface JwtPayload {
  sub: number;
  role: UserRole;
  id_account: number;
  /** Present on tokens issued after account-type claim was added; used for solo-coach vs gym UI. */
  account_type?: AccountType;
  /** When true, the client must complete password setup before using the shell routes. */
  requires_password_change?: boolean;
  /** Primary login email when present (for UI only, e.g. setup-password hint). */
  email?: string | null;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    await assertActiveJwtSession(this.prisma, payload.sub, payload.id_account);
    return payload;
  }
}
