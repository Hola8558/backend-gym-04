import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GenericStatus, User, UserRole, AccountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { assertStrongPassword } from '../common/utils/assert-strong-password.util';
import { startOfUtcDay } from '../common/utils/utc-date.util';
import { PrismaService } from '../core/prisma/prisma.service';
import { EMAIL_PROVIDER } from '../email/constants/email-provider.token';
import type { EmailProvider } from '../email/interfaces/email-provider.interface';
import { PasswordService } from '../password/password.service';
import { accountRequiresCustomerMembership } from './utils/account-requires-customer-membership.util';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { IdentifyResponseDto } from './dto/identify-response.dto';
import { findUserForPasswordReset } from './utils/find-user-for-password-reset.util';
import { generateTempPassword } from './utils/generate-temp-password.util';
import {
  assertAccountAllowsLogin,
  findActiveLoginUser,
} from './utils/find-active-login-user.util';
import { toIdentifyResponseDto } from './utils/identify-response.mapper';

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
    const user = await findActiveLoginUser(this.prisma, identifier);

    const invalid = new UnauthorizedException('AUTH.ERRORS.INVALID_CREDENTIALS');

    if (!user?.passwordHash) {
      throw invalid;
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw invalid;
    }

    const accountStatus = user.account.status;
    assertAccountAllowsLogin(accountStatus);

    await this.assertCustomerActiveMembershipForLogin(user);

    const access_token = await this.issueAccessTokenForUserId(user.idUser);
    return { access_token };
  }

  async identify(identifier: string): Promise<IdentifyResponseDto> {
    const trimmed = identifier.trim();
    const user = await findActiveLoginUser(this.prisma, trimmed);
    assertAccountAllowsLogin(user.account.status);
    return toIdentifyResponseDto(user.requiresPasswordChange, trimmed);
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
    user: User & { account: { status: GenericStatus; type: AccountType } },
  ): Promise<void> {
    const accountStatus = user.account.status;
    assertAccountAllowsLogin(accountStatus);
    await this.assertCustomerActiveMembershipForLogin(user);
  }

  /**
   * Generates a temporary password, persists it via PasswordService, and emails it.
   * Throws NotFoundException when the identifier does not resolve to a usable user.
   */
  async resetPassword(dto: ForgotPasswordDto): Promise<void> {
    const searchNumber = dto.userNumber?.trim();
    const searchIdentifier = dto.identifier?.trim();

    console.log(
      `--- DIAGNOSTIC 3 (NEST): SEARCHING identifier="${searchIdentifier ?? ''}" userNumber="${searchNumber ?? ''}" ---`,
    );

    const user = await findUserForPasswordReset(this.prisma, {
      identifier: searchIdentifier,
      userNumber: searchNumber,
    });

    if (!user) {
      console.log(
        '--- DIAGNOSTIC 4 (NEST): USER NOT FOUND. THROWING SILENT EXCEPTION. ---',
      );
      throw new NotFoundException('AUTH.ERRORS.USER_NOT_FOUND');
    }

    console.log(`--- DIAGNOSTIC 5 (NEST): USER FOUND = ${user.email} ---`);

    const email = user.email?.trim();
    if (!email) {
      console.log(
        '--- DIAGNOSTIC 5b (NEST): USER HAS NO EMAIL. THROWING SILENT EXCEPTION. ---',
      );
      throw new NotFoundException('AUTH.ERRORS.USER_NOT_FOUND');
    }

    const userName = this.resolvePasswordResetDisplayName(user);
    const newPasswordPlain = generateTempPassword();

    console.log(
      `--- DIAGNOSTIC 5c (NEST): UPDATING PASSWORD FOR idUser=${user.idUser}, language=${dto.language} ---`,
    );

    await this.passwordService.updateUserPassword(
      user.idUser,
      user.idAccount,
      newPasswordPlain,
      { requiresPasswordChange: true },
    );

    console.log(
      `--- DIAGNOSTIC 5d (NEST): CALLING emailProvider.sendEmail for ${email} ---`,
    );

    await this.emailProvider.sendEmail('PASSWORD_RESET', dto.language, {
      email,
      userName,
      password: newPasswordPlain,
    });

    console.log('--- DIAGNOSTIC 5e (NEST): resetPassword COMPLETED SUCCESSFULLY ---');
  }

  async setupPassword(
    identifier: string,
    newPassword: string,
  ): Promise<{ access_token: string }> {
    const plain = assertStrongPassword(newPassword);
    const user = await findActiveLoginUser(this.prisma, identifier);
    assertAccountAllowsLogin(user.account.status);

    if (!user.requiresPasswordChange) {
      throw new ForbiddenException('AUTH.ERRORS.PASSWORD_CHANGE_NOT_REQUIRED');
    }

    const passwordHash = await bcrypt.hash(plain, 10);

    await this.prisma.user.update({
      where: { idUser: user.idUser },
      data: {
        passwordHash,
        requiresPasswordChange: false,
      },
    });

    const access_token = await this.issueAccessTokenForUserId(user.idUser);
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

  /**
   * Customers on gym accounts, or solo coach accounts with membership management (5006),
   * must have at least one non-expired active membership (turnstile).
   */
  private async assertCustomerActiveMembershipForLogin(
    user: User & { account: { type: AccountType } },
  ): Promise<void> {
    if (user.role !== UserRole.customer) {
      return;
    }

    const requiresMembership = await accountRequiresCustomerMembership(
      this.prisma,
      user.idAccount,
      user.account.type,
    );
    if (!requiresMembership) {
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
