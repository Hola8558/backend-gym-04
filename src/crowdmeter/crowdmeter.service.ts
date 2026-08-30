import { Injectable } from '@nestjs/common';
import { CrowdmeterDay } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class CrowdmeterService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForAccount(idAccount: number) {
    return this.prisma.crowdmeter.findMany({
      where: { id_account: idAccount },
      select: {
        identifier: true,
        data: true,
      },
    });
  }

  async findNowForAccount(idAccount: number) {
    const row = await this.prisma.crowdmeter.findUnique({
      where: {
        id_account_identifier: {
          id_account: idAccount,
          identifier: CrowdmeterDay.now,
        },
      },
      select: { data: true },
    });

    return row?.data ?? null;
  }
}
