import { Injectable, NotFoundException } from '@nestjs/common';
import { GenericStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../core/prisma/prisma.service';
import { EntryLogPublicResponseDto } from './dto/entry-log-public-response.dto';

@Injectable()
export class EntryLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerByUserNumber(
    idAccount: number,
    userNumber: string,
  ): Promise<EntryLogPublicResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        userNumber,
        idAccount,
        status: GenericStatus.active,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found for this account');
    }

    const row = await this.prisma.entryLog.create({
      data: {
        entryDate: new Date(),
        status: GenericStatus.active,
        user: {
          connect: { idUser: user.idUser },
        },
      },
    });

    return plainToInstance(
      EntryLogPublicResponseDto,
      {
        entryDate: row.entryDate,
        status: row.status,
      },
      { excludeExtraneousValues: true },
    );
  }
}
