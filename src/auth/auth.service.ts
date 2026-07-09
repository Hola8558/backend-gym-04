import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GenericStatus, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { assertStrongPassword } from '../common/utils/assert-strong-password.util';
import { startOfUtcDay } from '../common/utils/utc-date.util';
import { PrismaService } from '../core/prisma/prisma.service';
import { EMAIL_PROVIDER } from '../email/constants/email-provider.token';
import type { EmailProvider } from '../email/interfaces/email-provider.interface';
import { PasswordService } from '../password/password.service';
import { LoginDto } from './dto/login.dto';
import { generateTempPassword } from './utils/generate-temp-password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwordService: PasswordService,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
  ) {}

  /**
   * Web dashboard login (identifier + password). Returns JWT only — no routines.
   *
   * For mobile/Tlakani, routine JSON enrichment (`exercise_id` → Exercise row via
   * `RoutineHydrationService`) runs on `CustomersService.loginCustomer` instead.
   */
  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const identifier = dto.identifier.trim();
    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await this.findActiveUserByEmail(identifier)
      : await this.findActiveUserByNumber(identifier);

    const invalid = new UnauthorizedException('AUTH.ERRORS.INVALID_CREDENTIALS');

    if (!user?.passwordHash) {
      throw invalid;
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw invalid;
    }

    const accountStatus = user.account.status;
    if (
      accountStatus !== GenericStatus.active &&
      accountStatus !== GenericStatus.pending
    ) {
      throw new ForbiddenException('AUTH.ERRORS.ACCOUNT_INVALID');
    }

    await this.assertCustomerActiveMembershipForLogin(user);

    const access_token = await this.issueAccessTokenForUserId(user.idUser);
    return { access_token };
  }

  /**
   * Issues a JWT payload identical to `/auth/login` after the caller validated identity
   * through an alternate surface (for example identifier-only mobile customer login).
   */
  async signAccessTokenForUserId(idUser: number): Promise<string> {
    return this.issueAccessTokenForUserId(idUser);
  }

  /**
   * Account tenancy + membership turnstile checks for authenticated customers only.
   * Call after resolving an active `UserRole.customer`.
   */
  async assertMobileCustomerEligible(
    user: User & { account: { status: GenericStatus } },
  ): Promise<void> {
    const accountStatus = user.account.status;
    if (
      accountStatus !== GenericStatus.active &&
      accountStatus !== GenericStatus.pending
    ) {
      throw new ForbiddenException('AUTH.ERRORS.ACCOUNT_INVALID');
    }
    await this.assertCustomerActiveMembershipForLogin(user);
  }

  /**
   * Generates a temporary password, persists it via PasswordService, and emails it.
   * Throws NotFoundException when the identifier does not resolve to a usable user.
   */
  async resetPassword(identifier: string, language: string): Promise<void> {
    const trimmed = identifier.trim();
    const user = await this.findUserForPasswordReset(trimmed);

    if (!user) {
      throw new NotFoundException('AUTH.ERRORS.USER_NOT_FOUND');
    }

    const email = user.email?.trim();
    if (!email) {
      throw new NotFoundException('AUTH.ERRORS.USER_NOT_FOUND');
    }

    const userName = this.resolvePasswordResetDisplayName(user);
    const newPasswordPlain = generateTempPassword();

    await this.passwordService.updateUserPassword(
      user.idUser,
      user.idAccount,
      newPasswordPlain,
      { requiresPasswordChange: true },
    );

    await this.emailProvider.sendEmail('PASSWORD_RESET', language, {
      email,
      userName,
      password: newPasswordPlain,
    });
  }

  async setupPassword(
    idUser: number,
    newPassword: string,
  ): Promise<{ access_token: string }> {
    const plain = assertStrongPassword(newPassword);

    const user = await this.prisma.user.findUnique({
      where: { idUser },
      select: {
        idUser: true,
        status: true,
        requiresPasswordChange: true,
      },
    });

    if (!user || user.status !== GenericStatus.active) {
      throw new UnauthorizedException('AUTH.ERRORS.INVALID_SESSION');
    }

    if (!user.requiresPasswordChange) {
      throw new ForbiddenException('AUTH.ERRORS.PASSWORD_CHANGE_NOT_REQUIRED');
    }

    const passwordHash = await bcrypt.hash(plain, 10);

    await this.prisma.user.update({
      where: { idUser },
      data: {
        passwordHash,
        requiresPasswordChange: false,
      },
    });

    const access_token = await this.issueAccessTokenForUserId(idUser);
    return { access_token };
  }

  private async issueAccessTokenForUserId(idUser: number): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { idUser },
      include: { profile: true, account: true },
    });

    if (!user || user.status !== GenericStatus.active) {
      throw new UnauthorizedException('AUTH.ERRORS.INVALID_SESSION');
    }

    const days = user.profile?.timeSessionAlive ?? 7;
    const payload = {
      sub: user.idUser,
      role: user.role,
      id_account: user.idAccount,
      account_type: user.account.type,
      requires_password_change: user.requiresPasswordChange,
      ...(user.email != null && user.email.trim() !== ''
        ? { email: user.email.trim() }
        : {}),
    };

    return this.jwt.signAsync(payload, {
      expiresIn: `${days}d`,
    });
  }

  /**
   * Resolves a non-deleted user by email or userNumber for password reset.
   * Returns null when not found (caller maps to NotFoundException).
   */
  private async findUserForPasswordReset(identifier: string) {
    const isEmail = identifier.includes('@');

    if (isEmail) {
      const users = await this.prisma.user.findMany({
        where: {
          email: identifier,
          status: { not: GenericStatus.deleted },
        },
        include: { account: true, profile: true },
      });

      if (users.length === 0) {
        return null;
      }

      if (users.length > 1) {
        const active = users.filter((u) => u.status === GenericStatus.active);
        if (active.length === 1) {
          return active[0];
        }
        return null;
      }

      return users[0];
    }

    return this.prisma.user.findFirst({
      where: {
        userNumber: identifier,
        status: { not: GenericStatus.deleted },
      },
      include: { account: true, profile: true },
    });
  }

  private resolvePasswordResetDisplayName(user: {
    profile: { name: string | null; lastName: string | null } | null;
    account: { name: string | null };
  }): string {
    const profileName = [user.profile?.name, user.profile?.lastName]
      .filter((part) => part != null && part.trim() !== '')
      .join(' ')
      .trim();

    if (profileName) {
      return profileName;
    }

    return user.account.name?.trim() || 'Tlakani';
  }

  private async findActiveUserByNumber(identifier: string) {
    const user = await this.prisma.user.findUnique({
      where: { userNumber: identifier },
      include: { profile: true, account: true },
    });

    if (!user || user.status !== GenericStatus.active) {
      throw new UnauthorizedException('AUTH.ERRORS.INVALID_CREDENTIALS');
    }

    return user;
  }

  private async findActiveUserByEmail(identifier: string) {
    const users = await this.prisma.user.findMany({
      where: { email: identifier },
      include: { profile: true, account: true },
    });

    const activeUsers = users.filter((user) => user.status === GenericStatus.active);

    if (activeUsers.length === 0) {
      throw new UnauthorizedException('AUTH.ERRORS.INVALID_CREDENTIALS');
    }

    if (activeUsers.length > 1) {
      throw new ConflictException('AUTH.ERRORS.MULTIPLE_ACTIVE_ACCOUNTS');
    }

    return activeUsers[0];
  }

  /**
   * Customers must have at least one non-expired active membership (turnstile).
   */
  private async assertCustomerActiveMembershipForLogin(user: User): Promise<void> {
    if (user.role !== UserRole.customer) {
      return;
    }

    const today = startOfUtcDay(new Date());
    const active = await this.prisma.customerMembership.findFirst({
      where: {
        idUser: user.idUser,
        status: GenericStatus.active,
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
    });

    if (!active) {
      throw new ForbiddenException('AUTH.ERRORS.CUSTOMER_NO_ACTIVE_MEMBERSHIP');
    }
  }
}
