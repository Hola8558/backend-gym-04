import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, Ingredient, UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../core/prisma/prisma.service';
import { HistoryCustomerMenuItemDto } from './dto/history-customer-menu-item.dto';
import { SyncActiveCustomerMenuDto } from './dto/sync-active-customer-menu.dto';
import { SyncActiveCustomerMenuResponseDto } from './dto/sync-active-customer-menu-response.dto';
import { buildIngredientMap } from './utils/build-ingredient-map.util';
import { collectMenuIngredientIds } from './utils/collect-menu-ingredient-ids.util';
import { hydrateMenuPlan } from './utils/hydrate-menu-plan.util';
import { menuTimestampsMatch } from './utils/menu-timestamps-match.util';

@Injectable()
export class CustomersMenusService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sync newest non-deleted menu for a customer.
   * If client created_at + updated_at match → `{ isUpToDate: true }` (200).
   * Otherwise → full hydrated menu + timestamps.
   */
  async syncActiveMenuHydrated(
    idAccount: number,
    jwtUserId: number,
    idUserParam: number,
    dto: SyncActiveCustomerMenuDto,
  ): Promise<SyncActiveCustomerMenuResponseDto> {
    await this.assertMenuViewerAccess(idAccount, jwtUserId, idUserParam);

    const menu = await this.prisma.customerMenu.findFirst({
      where: {
        idUser: idUserParam,
        status: { not: GenericStatus.deleted },
        user: { idAccount },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!menu) {
      throw new NotFoundException('CUSTOMERS.ERRORS.MENU_NOT_FOUND');
    }

    if (
      menuTimestampsMatch(
        menu.createdAt,
        menu.updatedAt,
        dto.created_at,
        dto.updated_at,
      )
    ) {
      return plainToInstance(
        SyncActiveCustomerMenuResponseDto,
        { isUpToDate: true },
        { excludeExtraneousValues: true },
      );
    }

    const byId = await this.loadIngredientMapForMenus([menu.data]);
    const data = hydrateMenuPlan(menu.data, byId);

    return plainToInstance(
      SyncActiveCustomerMenuResponseDto,
      {
        isUpToDate: false,
        created_at: menu.createdAt,
        updated_at: menu.updatedAt,
        data,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * All non-deleted menus for a customer, newest first, each fully hydrated.
   */
  async getMenuHistoryHydrated(
    idAccount: number,
    jwtUserId: number,
    idUserParam: number,
  ): Promise<HistoryCustomerMenuItemDto[]> {
    await this.assertMenuViewerAccess(idAccount, jwtUserId, idUserParam);

    const menus = await this.prisma.customerMenu.findMany({
      where: {
        idUser: idUserParam,
        status: { not: GenericStatus.deleted },
        user: { idAccount },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (menus.length === 0) {
      return [];
    }

    const byId = await this.loadIngredientMapForMenus(
      menus.map((menu) => menu.data),
    );

    return menus.map((menu) =>
      plainToInstance(
        HistoryCustomerMenuItemDto,
        {
          id_menu: menu.idMenu,
          created_at: menu.createdAt,
          updated_at: menu.updatedAt,
          data: hydrateMenuPlan(menu.data, byId),
        },
        { excludeExtraneousValues: true },
      ),
    );
  }

  private async loadIngredientMapForMenus(
    dataList: unknown[],
  ): Promise<Map<number, Ingredient>> {
    const ids = [
      ...new Set(dataList.flatMap((data) => collectMenuIngredientIds(data))),
    ];
    if (ids.length === 0) {
      return new Map();
    }

    const ingredients = await this.prisma.ingredient.findMany({
      where: { idIngredient: { in: ids } },
    });
    return buildIngredientMap(ingredients);
  }

  private async assertMenuViewerAccess(
    idAccount: number,
    jwtUserId: number,
    idUserParam: number,
  ): Promise<void> {
    await this.assertCustomerBelongsToAccount(idAccount, idUserParam);

    const actor = await this.prisma.user.findFirst({
      where: {
        idUser: jwtUserId,
        idAccount,
        status: { not: GenericStatus.deleted },
      },
      select: { idUser: true, role: true },
    });
    if (!actor) {
      throw new ForbiddenException('CUSTOMERS.ERRORS.MENU_ACCESS_DENIED');
    }
    if (actor.role === UserRole.customer && jwtUserId !== idUserParam) {
      throw new ForbiddenException('CUSTOMERS.ERRORS.MENU_ACCESS_DENIED');
    }
  }

  /** Same tenancy rule as `RoutinesService.assertCustomerBelongsToAccount`. */
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
      throw new ForbiddenException('CUSTOMERS.ERRORS.MENU_ACCESS_DENIED');
    }
  }
}
