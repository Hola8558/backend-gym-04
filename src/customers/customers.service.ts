import { Injectable, NotFoundException } from '@nestjs/common';
import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { SharedUsersService } from '../users/shared-users.service';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomerSource } from './types/customer-source.type';
import { toCustomerResponseDto } from './utils/customer-response.mapper';

const customerSearchSelect = {
  idUser: true,
  email: true,
  status: true,
  editAt: true,
  profile: {
    select: {
      name: true,
      lastName: true,
      phone: true,
      emergencyPhone: true,
      createdAt: true,
    },
  },
} as const satisfies Prisma.UserSelect;

@Injectable()
export class CustomersService {
  constructor(
    private readonly sharedUsers: SharedUsersService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    id_account: number,
    page = 1,
    limit = 50,
    search = '',
  ): Promise<{ data: CustomerResponseDto[]; total: number }> {
    const take = Math.max(Number(limit) || 50, 1);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    const where = this.buildCustomerWhere(id_account, search);

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: customerSearchSelect,
        orderBy: { idUser: 'asc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: rows.map((row) => toCustomerResponseDto(row as CustomerSource)),
      total,
    };
  }

  async findOne(
    id_user: number,
    id_account: number,
  ): Promise<CustomerResponseDto> {
    const row = await this.sharedUsers.findOneByIdAndRole(
      id_user,
      id_account,
      UserRole.customer,
    );
    if (!row) {
      throw new NotFoundException('Customer not found');
    }
    return toCustomerResponseDto(row);
  }

  async searchCustomers(
    query: string,
    accountId: number,
    page = 1,
    limit = 50,
  ): Promise<{ data: CustomerResponseDto[]; total: number }> {
    return this.findAll(accountId, page, limit, query);
  }

  async update(
    id_user: number,
    id_account: number,
    dto: UpdateUserDto,
  ): Promise<CustomerResponseDto> {
    const row = await this.sharedUsers.updateUser(
      id_user,
      id_account,
      UserRole.customer,
      dto,
    );
    if (!row) {
      throw new NotFoundException('Customer not found');
    }
    return toCustomerResponseDto(row);
  }

  async remove(id_user: number, id_account: number, actor_user_id: number) {
    const ok = await this.sharedUsers.softDeleteUser(
      id_user,
      id_account,
      UserRole.customer,
      actor_user_id,
    );
    if (!ok) {
      throw new NotFoundException('Customer not found');
    }
    return { deleted: true };
  }

  private buildCustomerWhere(
    idAccount: number,
    search: string,
  ): Prisma.UserWhereInput {
    const normalizedQuery = search.trim();

    return {
      idAccount,
      role: UserRole.customer,
      status: { not: GenericStatus.deleted },
      ...(normalizedQuery
        ? {
            OR: [
              {
                email: {
                  contains: normalizedQuery,
                  mode: 'insensitive',
                },
              },
              {
                profile: {
                  is: {
                    name: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                profile: {
                  is: {
                    lastName: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                profile: {
                  is: {
                    phone: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
  }
}
