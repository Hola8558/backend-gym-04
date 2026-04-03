import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, MembershipType, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateMembershipTypeDto } from './dto/create-membership-type.dto';
import { UpdateMembershipTypeDto } from './dto/update-membership-type.dto';

@Injectable()
export class MembershipTypesService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(row: MembershipType) {
    return {
      id_account: row.idAccount,
      id_membership_type: row.idMembershipType,
      name: row.name,
      duration_days: row.durationDays,
      price: row.price.toString(),
      created_at: row.createdAt,
      status: row.status,
    };
  }

  private resolveListStatusFilter(statusParam?: string): GenericStatus | null {
    if (statusParam === undefined || statusParam === '') {
      return null;
    }
    const allowed = Object.values(GenericStatus) as string[];
    if (!allowed.includes(statusParam)) {
      throw new BadRequestException(`Invalid status: ${statusParam}`);
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
        createdAt: now,
        status: GenericStatus.active,
      },
    });

    return this.toResponse(row);
  }

  async findAll(idAccount: number, statusQuery?: string) {
    const explicitStatus = this.resolveListStatusFilter(statusQuery);
    const where: Prisma.MembershipTypeWhereInput = { idAccount };
    if (explicitStatus !== null) {
      where.status = explicitStatus;
    } else {
      where.status = {
        in: [GenericStatus.active, GenericStatus.inactive],
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
        throw new NotFoundException('Membership type not found');
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
        throw new NotFoundException('Membership type not found');
      }
      throw e;
    }
  }

  async softDelete(idAccount: number, idMembershipType: number) {
    try {
      const row = await this.prisma.membershipType.update({
        where: {
          idAccount_idMembershipType: { idAccount, idMembershipType },
        },
        data: { status: GenericStatus.deleted },
      });
      return this.toResponse(row);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Membership type not found');
      }
      throw e;
    }
  }
}
