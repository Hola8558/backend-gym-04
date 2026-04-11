import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    idAccount: number,
    idUser: number,
    action: string,
    entity: string,
    entityId?: number,
    metadata?: Prisma.InputJsonObject,
  ): Promise<void> {
    if (
      metadata !== undefined &&
      (metadata === null || Array.isArray(metadata))
    ) {
      throw new BadRequestException(
        'Activity log metadata must be a structured JSON object.',
      );
    }

    await this.prisma.activityLog.create({
      data: {
        id_account: idAccount,
        id_user: idUser,
        action,
        entity,
        entity_id: entityId,
        metadata,
      },
    });
  }
}
