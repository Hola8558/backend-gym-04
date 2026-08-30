import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { RoutinePlanResponseDto } from './dto/routine-plan-response.dto';
import { RoutineSaveResponseDto } from './dto/routine-save-response.dto';

const WEEK_DAY_KEYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] as const;
const LAST_MSG_SENT_KEY = 'last_msg_sent';
type WeekDayKey = (typeof WEEK_DAY_KEYS)[number];
type RoutineWeekData = Record<'week', number> &
  Record<WeekDayKey, unknown[] | null> & {
    last_msg_sent?: string;
  };

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdate(
    idAccount: number,
    dto: CreateRoutineDto,
  ): Promise<RoutineSaveResponseDto> {
    await this.assertCustomerBelongsToAccount(idAccount, dto.id_user);
    const incomingData = this.buildIncomingWeekData(dto);

    const existing = await this.prisma.routine.findFirst({
      where: {
        idAccount,
        idUser: dto.id_user,
        status: GenericStatus.active,
        data: {
          path: ['week'],
          equals: dto.week,
        },
      },
    });

    if (existing) {
      await this.prisma.routine.update({
        where: { idRoutine: existing.idRoutine },
        data: this.buildRoutineUpdateData(dto, existing.data, incomingData),
      });
      return this.toSaveResponse(200);
    }

    await this.prisma.routine.create({
      data: {
        idAccount,
        idUser: dto.id_user,
        data: incomingData as Prisma.InputJsonObject,
        name: dto.name ?? null,
        status: GenericStatus.active,
      },
    });
    return this.toSaveResponse(201);
  }

  async updateById(
    idAccount: number,
    idRoutine: number,
    dto: CreateRoutineDto,
  ): Promise<RoutineSaveResponseDto> {
    await this.assertCustomerBelongsToAccount(idAccount, dto.id_user);
    const existing = await this.prisma.routine.findFirst({
      where: {
        idRoutine,
        idAccount,
        idUser: dto.id_user,
        status: GenericStatus.active,
      },
    });

    if (!existing) {
      throw new NotFoundException('ROUTINES.ERRORS.NOT_FOUND');
    }

    const incomingData = this.buildIncomingWeekData(dto);
    await this.prisma.routine.update({
      where: { idRoutine },
      data: this.buildRoutineUpdateData(dto, existing.data, incomingData),
    });

    return this.toSaveResponse(200);
  }

  async findPlanForCustomer(
    idAccount: number,
    idUserTarget: number,
  ): Promise<RoutinePlanResponseDto> {
    const customer = await this.prisma.user.findFirst({
      where: {
        idUser: idUserTarget,
        idAccount,
        role: UserRole.customer,
        status: GenericStatus.active,
      },
      select: { idUser: true },
    });

    if (!customer) {
      throw new NotFoundException('ROUTINES.ERRORS.CUSTOMER_NOT_FOUND');
    }

    const routine = await this.prisma.routine.findFirst({
      where: {
        idUser: idUserTarget,
        status: GenericStatus.active,
        user: { idAccount },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!routine) {
      throw new NotFoundException('ROUTINES.ERRORS.PLAN_NOT_FOUND');
    }

    return plainToInstance(
      RoutinePlanResponseDto,
      {
        id_routine: routine.idRoutine,
        name: routine.name,
        data: routine.data as Record<string, unknown>,
        status: routine.status,
        created_at: routine.createdAt,
        edited_at: routine.editedAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  async findRoutinesForCustomer(
    idAccount: number,
    idUserTarget: number,
  ): Promise<RoutinePlanResponseDto[]> {
    await this.assertCustomerBelongsToAccount(idAccount, idUserTarget);

    const routines = await this.prisma.routine.findMany({
      where: {
        idAccount,
        idUser: idUserTarget,
        status: GenericStatus.active,
      },
      orderBy: { createdAt: 'asc' },
    });

    return routines.map((routine) =>
      plainToInstance(
        RoutinePlanResponseDto,
        {
          id_routine: routine.idRoutine,
          name: routine.name,
          data: routine.data as Record<string, unknown>,
          status: routine.status,
          created_at: routine.createdAt,
          edited_at: routine.editedAt,
        },
        { excludeExtraneousValues: true },
      ),
    );
  }

  private async assertCustomerBelongsToAccount(
    idAccount: number,
    idUser: number,
  ): Promise<void> {
    const customer = await this.prisma.user.findFirst({
      where: {
        idUser,
        idAccount,
        role: UserRole.customer,
        status: GenericStatus.active,
      },
      select: { idUser: true },
    });

    if (!customer) {
      throw new ForbiddenException('ROUTINES.ERRORS.CUSTOMER_FORBIDDEN');
    }
  }

  private buildIncomingWeekData(dto: CreateRoutineDto): RoutineWeekData {
    const data: RoutineWeekData = {
      week: dto.week,
      Lun: null,
      Mar: null,
      Mie: null,
      Jue: null,
      Vie: null,
      Sab: null,
      Dom: null,
    };

    let hasSubmittedDay = false;
    for (const key of WEEK_DAY_KEYS) {
      const items = dto[key];
      if (items === undefined || items === null) {
        continue;
      }
      data[key] = items;
      hasSubmittedDay = true;
    }

    if (!hasSubmittedDay) {
      throw new BadRequestException('ROUTINES.ERRORS.EMPTY_ROUTINE');
    }

    const lastMsgSent = dto.last_msg_sent?.trim();
    if (lastMsgSent) {
      data.last_msg_sent = lastMsgSent;
    }

    return data;
  }

  private buildRoutineUpdateData(
    dto: CreateRoutineDto,
    existingData: Prisma.JsonValue,
    incomingData: RoutineWeekData,
  ): Prisma.RoutineUpdateInput {
    const mergedData = this.mergeWeekData(existingData, incomingData);
    const data: Prisma.RoutineUpdateInput = {
      data: mergedData as Prisma.InputJsonObject,
    };
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    return data;
  }

  private mergeWeekData(
    existingData: Prisma.JsonValue,
    incomingData: RoutineWeekData,
  ): RoutineWeekData {
    const existing =
      typeof existingData === 'object' && existingData !== null && !Array.isArray(existingData)
        ? (existingData as Record<string, unknown>)
        : {};

    const merged: RoutineWeekData = {
      week: incomingData.week,
      Lun: this.readExistingDay(existing, 'Lun'),
      Mar: this.readExistingDay(existing, 'Mar'),
      Mie: this.readExistingDay(existing, 'Mie'),
      Jue: this.readExistingDay(existing, 'Jue'),
      Vie: this.readExistingDay(existing, 'Vie'),
      Sab: this.readExistingDay(existing, 'Sab'),
      Dom: this.readExistingDay(existing, 'Dom'),
    };

    for (const key of WEEK_DAY_KEYS) {
      if (incomingData[key] !== null) {
        merged[key] = incomingData[key];
      }
    }

    const existingLastMsg = existing[LAST_MSG_SENT_KEY];
    if (typeof existingLastMsg === 'string' && existingLastMsg.trim()) {
      merged.last_msg_sent = existingLastMsg.trim();
    }
    if (incomingData.last_msg_sent?.trim()) {
      merged.last_msg_sent = incomingData.last_msg_sent.trim();
    }

    return merged;
  }

  private readExistingDay(
    existing: Record<string, unknown>,
    key: WeekDayKey,
  ): unknown[] | null {
    return Array.isArray(existing[key]) ? existing[key] : null;
  }

  private toSaveResponse(statusCode: 200 | 201): RoutineSaveResponseDto {
    return plainToInstance(
      RoutineSaveResponseDto,
      { statusCode, message: 'Success' },
      { excludeExtraneousValues: true },
    );
  }
}
