import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GenericStatus, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { startOfUtcDay } from '../common/utils/utc-date.util';
import { PrismaService } from '../core/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { userNumber: dto.identifier }],
        status: GenericStatus.active,
      },
      include: { profile: true, account: true },
    });

    const invalid = new UnauthorizedException('Invalid email or password');

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
      throw new ForbiddenException('Account invalid');
    }

    await this.assertCustomerActiveMembershipForLogin(user);

    const days = user.profile?.timeSessionAlive ?? 7;
    const payload = {
      sub: user.idUser,
      role: user.role,
      id_account: user.idAccount
    };

    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: `${days}d`,
    });

    return { access_token };
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
      throw new ForbiddenException(
        'Access Denied: You do not have an active membership. Please contact your gym owner.',
      );
    }
  }
}
