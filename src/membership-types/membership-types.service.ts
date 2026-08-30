import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, MembershipType, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateMembershipTypeDto } from './dto/create-membership-type.dto';
import { MembershipTypeResponseDto } from './dto/membership-type-response.dto';
import { UpdateMembershipTypeDto } from './dto/update-membership-type.dto';

@Injectable()
export class MembershipTypesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeFeatures(value: string | undefined): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  private toResponse(row: MembershipType): MembershipTypeResponseDto {
    return plainToInstance(
      MembershipTypeResponseDto,
      {
        id_membership_type: row.idMembershipType,
        name: row.name,
        duration_days: row.durationDays,
        price: row.price.toString(),
        features: row.features ?? null,
        status: row.status,
      },
      { excludeExtraneousValues: true },
    );
  }

  private resolveListStatusFilter(statusParam?: string): GenericStatus | null {
    if (statusParam === undefined || statusParam === '') {
      return null;
    }
    const allowed = Object.values(GenericStatus) as string[];
    if (!allowed.includes(statusParam)) {
      throw new BadRequestException('MEMBERSHIP_TYPES.ERRORS.INVALID_STATUS');
    }
    return statusParam as GenericStatus;
  }

  private buildUpdateData(
    dto: UpdateMembershipTypeDto,
  ): Prisma.MembershipTypeUpdateInput {
    const data: Prisma.MembershipTypeUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.duration_days !== undefined) {
      data.durationDays = dto.duration_days;
    }
    if (dto.price !== undefined) {
      data.price = dto.price;
    }
    if (dto.features !== undefined) {
      data.features = this.normalizeFeatures(dto.features) ?? null;
    }
    return data;
  }

  async create(idAccount: number, dto: CreateMembershipTypeDto) {
    const { _max } = await this.prisma.membershipType.aggregate({
      where: { idAccount },
      _max: { idMembershipType: true },
    });
    const nextId = (_max.idMembershipType ?? 0) + 1;
    const now = new Date();

    const row = await this.prisma.membershipType.create({
      data: {
        idAccount,
        idMembershipType: nextId,
        name: dto.name,
        durationDays: dto.duration_days,
        price: dto.price,
        features: this.normalizeFeatures(dto.features),
        createdAt: now,
        status: GenericStatus.active,
      },
    });

    return this.toResponse(row);
  }

  private async countActiveCustomerMemberships(
    idAccount: number,
    idMembershipType: number,
  ): Promise<number> {
    return this.prisma.customerMembership.count({
      where: {
        idAccount,
        idMembershipType,
        status: GenericStatus.active,
      },
    });
  }

  async canDelete(idAccount: number, idMembershipType: number) {
    const count = await this.countActiveCustomerMemberships(
      idAccount,
      idMembershipType,
    );
    if (count > 0) {
      throw new ConflictException('MEMBERSHIPS.ERRORS.HAS_ACTIVE_CUSTOMERS');
    }
    return { canDelete: true as const };
  }

  async findAll(idAccount: number, statusQuery?: string) {
    const explicitStatus = this.resolveListStatusFilter(statusQuery);
    const where: Prisma.MembershipTypeWhereInput = { idAccount };
    if (explicitStatus !== null) {
      where.status = explicitStatus;
    } else {
      where.status = {
        in: [GenericStatus.active],
      };
    }

    const rows = await this.prisma.membershipType.findMany({
      where,
      orderBy: { idMembershipType: 'asc' },
    });

    return rows.map((r) => this.toResponse(r));
  }

  async update(
    idAccount: number,
    idMembershipType: number,
    dto: UpdateMembershipTypeDto,
  ) {
    const data = this.buildUpdateData(dto);
    if (Object.keys(data).length === 0) {
      const existing = await this.prisma.membershipType.findUnique({
        where: {
          idAccount_idMembershipType: { idAccount, idMembershipType },
        },
      });
      if (!existing) {
        throw new NotFoundException('MEMBERSHIP_TYPES.ERRORS.NOT_FOUND');
      }
      return this.toResponse(existing);
    }

    try {
      const row = await this.prisma.membershipType.update({
        where: {
          idAccount_idMembershipType: { idAccount, idMembershipType },
        },
        data,
      });
      return this.toResponse(row);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('MEMBERSHIP_TYPES.ERRORS.NOT_FOUND');
      }
      throw e;
    }
  }

  async softDelete(idAccount: number, idMembershipType: number) {
    const activeCount = await this.countActiveCustomerMemberships(
      idAccount,
      idMembershipType,
    );
    if (activeCount > 0) {
      throw new ConflictException('MEMBERSHIPS.ERRORS.HAS_ACTIVE_CUSTOMERS');
    }

    try {
      const row = await this.prisma.membershipType.update({
        where: {
          idAccount_idMembershipType: { idAccount, idMembershipType },
        },
        data: { status: GenericStatus.inactive },
      });
      return this.toResponse(row);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('MEMBERSHIP_TYPES.ERRORS.NOT_FOUND');
      }
      throw e;
    }
  }
}
