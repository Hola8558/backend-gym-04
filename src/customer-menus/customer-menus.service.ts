import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CustomerMenu,
  GenericStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateCustomerMenuDto } from './dto/create-customer-menu.dto';
import { CustomerMenuCountResponseDto } from './dto/customer-menu-count-response.dto';
import { CustomerMenuResponseDto } from './dto/customer-menu-response.dto';
import { DeleteCustomerMenuResponseDto } from './dto/delete-customer-menu-response.dto';
import { UpdateCustomerMenuDto } from './dto/update-customer-menu.dto';

@Injectable()
export class CustomerMenusService {
  constructor(private readonly prisma: PrismaService) {}

  async findCountsForAccount(
    idAccount: number,
  ): Promise<CustomerMenuCountResponseDto[]> {
    const grouped = await this.prisma.customerMenu.groupBy({
      by: ['idUser'],
      where: {
        status: GenericStatus.active,
        user: {
          idAccount,
          role: UserRole.customer,
          status: { not: GenericStatus.deleted },
        },
      },
      _count: { idMenu: true },
    });

    return grouped.map((row) =>
      plainToInstance(
        CustomerMenuCountResponseDto,
        {
          id_user: row.idUser,
          count: row._count.idMenu,
        },
        { excludeExtraneousValues: true },
      ),
    );
  }

  async findAllForCustomer(
    idAccount: number,
    idUser: number,
  ): Promise<CustomerMenuResponseDto[]> {
    await this.assertCustomerBelongsToAccount(idAccount, idUser);

    const rows = await this.prisma.customerMenu.findMany({
      where: {
        idUser,
        status: { not: GenericStatus.deleted },
        user: { idAccount },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toResponse(row));
  }

  async findOne(
    idAccount: number,
    idMenu: number,
  ): Promise<CustomerMenuResponseDto> {
    const row = await this.findTenantMenuOrThrow(idAccount, idMenu);
    return this.toResponse(row);
  }

  async create(
    idAccount: number,
    dto: CreateCustomerMenuDto,
  ): Promise<CustomerMenuResponseDto> {
    await this.assertCustomerBelongsToAccount(idAccount, dto.id_user);

    const row = await this.prisma.customerMenu.create({
      data: {
        idUser: dto.id_user,
        status: GenericStatus.active,
        data: dto.data as Prisma.InputJsonValue,
      },
    });

    return this.toResponse(row);
  }

  async update(
    idAccount: number,
    idMenu: number,
    dto: UpdateCustomerMenuDto,
  ): Promise<CustomerMenuResponseDto> {
    await this.findTenantMenuOrThrow(idAccount, idMenu);

    const row = await this.prisma.customerMenu.update({
      where: { idMenu },
      data: {
        data: dto.data as Prisma.InputJsonValue,
      },
    });

    return this.toResponse(row);
  }

  async softDelete(
    idAccount: number,
    idMenu: number,
  ): Promise<DeleteCustomerMenuResponseDto> {
    await this.findTenantMenuOrThrow(idAccount, idMenu);

    await this.prisma.customerMenu.update({
      where: { idMenu },
      data: { status: GenericStatus.deleted },
    });

    return plainToInstance(
      DeleteCustomerMenuResponseDto,
      { success: true },
      { excludeExtraneousValues: true },
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
        status: { not: GenericStatus.deleted },
      },
      select: { idUser: true },
    });

    if (!customer) {
      throw new NotFoundException('CUSTOMER_MENUS.ERRORS.CUSTOMER_NOT_FOUND');
    }
  }

  private async findTenantMenuOrThrow(
    idAccount: number,
    idMenu: number,
  ): Promise<CustomerMenu> {
    const row = await this.prisma.customerMenu.findFirst({
      where: {
        idMenu,
        status: { not: GenericStatus.deleted },
        user: {
          idAccount,
          role: UserRole.customer,
        },
      },
    });

    if (!row) {
      throw new NotFoundException('CUSTOMER_MENUS.ERRORS.NOT_FOUND');
    }

    return row;
  }

  private toResponse(row: CustomerMenu): CustomerMenuResponseDto {
    return plainToInstance(
      CustomerMenuResponseDto,
      {
        id_menu: row.idMenu,
        id_user: row.idUser,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
        status: row.status,
        data:
          typeof row.data === 'object' &&
          row.data !== null &&
          !Array.isArray(row.data)
            ? (row.data as Record<string, unknown>)
            : {},
      },
      { excludeExtraneousValues: true },
    );
  }
}
