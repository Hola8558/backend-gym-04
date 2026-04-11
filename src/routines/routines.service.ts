import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { RoutineResponseDto } from './dto/routine-response.dto';

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateRoutineDto,
    user?: JwtPayload,
  ): Promise<RoutineResponseDto> {
    if (!user && dto.id_user != null) {
      throw new UnauthorizedException(
        'Guests cannot assign routines to specific users.',
      );
    }

    const data: Prisma.RoutineCreateInput = {
      data: dto.data as Prisma.InputJsonObject,
    };

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (user) {
      data.account = {
        connect: { idAccount: user.id_account },
      };

      if (dto.id_user != null) {
        const targetUser = await this.prisma.user.findFirst({
          where: {
            idUser: dto.id_user,
            idAccount: user.id_account,
          },
          select: { idUser: true },
        });

        if (!targetUser) {
          throw new NotFoundException('User not found in this account');
        }

        data.user = {
          connect: { idUser: dto.id_user },
        };
      }
    }

    const row = await this.prisma.routine.create({
      data,
    });

    return plainToInstance(
      RoutineResponseDto,
      {
        name: row.name,
        data: row.data,
        created_at: row.createdAt,
      },
      { excludeExtraneousValues: true },
    );
  }
}
