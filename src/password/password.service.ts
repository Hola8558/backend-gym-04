import { Injectable, NotFoundException } from '@nestjs/common';
import { GenericStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { assertStrongPassword } from '../common/utils/assert-strong-password.util';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class PasswordService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Centralized password update: validates strength, hashes with bcrypt, persists hash.
   * Reusable across profile, admin, and customer flows.
   */
  async updateUserPassword(
    idUser: number,
    idAccount: number,
    newPasswordPlain: string,
    options?: { requiresPasswordChange?: boolean },
  ): Promise<void> {
    const plain = assertStrongPassword(newPasswordPlain);

    const user = await this.prisma.user.findFirst({
      where: {
        idUser,
        idAccount,
        status: { not: GenericStatus.deleted },
      },
      select: { idUser: true },
    });

    if (!user) {
      throw new NotFoundException('PROFILE.ERRORS.NOT_FOUND');
    }

    const passwordHash = await bcrypt.hash(plain, 10);

    await this.prisma.user.update({
      where: { idUser },
      data: {
        passwordHash,
        requiresPasswordChange: options?.requiresPasswordChange ?? false,
      },
    });
  }
}
