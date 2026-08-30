import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericStatus, UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import {
  type CreateUserResponse,
  UsersService,
} from '../users/users.service';
import { SharedUsersService } from '../users/shared-users.service';
import type { CoachDelegatedFeatureItemDto } from './dto/coach-delegated-feature-item.dto';
import { CreateCoachDto } from './dto/create-coach.dto';
import { CoachListStatus } from './dto/coach-list-status.query';
import { UpdateCoachDto } from './dto/update-coach.dto';
import type { DelegatableCoachFeatureApi } from './types/delegatable-coach-feature-api.type';
import { toAssignedCustomerRowDto } from './utils/to-assigned-customer-row.dto';
import { applyCoachDelegatedParentInactiveCascade } from './utils/apply-coach-delegated-feature-cascade.util';
import { loadCoachDelegatableFeatureCatalog } from './utils/load-coach-delegatable-feature-catalog.util';
import {
  mapFeatureFlagRowToDelegatableApi,
  orderDelegatableCoachFeatures,
} from './utils/map-delegatable-coach-features.util';
import {
  coachUserPublicSelect,
  deletedCoachListSelect,
  mapDeletedCoachListRow,
} from './utils/map-deleted-coach-list-row';

@Injectable()
export class CoachesService {
  constructor(
    private readonly sharedUsers: SharedUsersService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    id_account: number,
    listStatus: CoachListStatus = CoachListStatus.ACTIVE,
    actor: JwtPayload,
  ) {
    const isOwner = this.isActorOwner(actor);

    if (listStatus === CoachListStatus.ACTIVE) {
      const rows = await this.prisma.user.findMany({
        where: {
          idAccount: id_account,
          role: UserRole.coach,
          status: GenericStatus.active,
        },
        select: coachUserPublicSelect,
        orderBy: { idUser: 'asc' },
      });
      const byCoach = isOwner
        ? await this.loadDelegatableFeaturesByCoachIds(
            rows.map((r) => r.idUser),
          )
        : null;
      return rows.map((row) => ({
        ...row,
        delegatableFeatures: isOwner
          ? (byCoach!.get(row.idUser) ?? [])
          : null,
      }));
    }

    const rows = await this.prisma.user.findMany({
      where: {
        idAccount: id_account,
        role: UserRole.coach,
        status: GenericStatus.deleted,
      },
      select: deletedCoachListSelect,
      orderBy: { idUser: 'asc' },
    });
    const mapped = rows.map((r) => mapDeletedCoachListRow(r));
    const byCoach = isOwner
      ? await this.loadDelegatableFeaturesByCoachIds(
          mapped.map((r) => r.idUser),
        )
      : null;
    return mapped.map((r) => ({
      ...r,
      delegatableFeatures: isOwner ? (byCoach!.get(r.idUser) ?? []) : null,
    }));
  }

  private isActorOwner(actor: JwtPayload): boolean {
    return actor.role?.toLowerCase() === 'owner';
  }

  /**
   * Customizable catalog features joined with this coach's feature_flag row (state).
   */
  private async loadDelegatableFeaturesByCoachIds(
    coachUserIds: number[],
  ): Promise<Map<number, DelegatableCoachFeatureApi[]>> {
    const result = new Map<number, DelegatableCoachFeatureApi[]>();
    if (coachUserIds.length === 0) {
      return result;
    }

    const catalog = await loadCoachDelegatableFeatureCatalog(this.prisma);
    const rows = await this.prisma.featureFlag.findMany({
      where: {
        idUser: { in: coachUserIds },
        status: { not: GenericStatus.deleted },
        feature: {
          role: UserRole.coach,
          customizable: true,
          status: { not: GenericStatus.deleted },
        },
      },
      include: { feature: true },
      orderBy: [{ idUser: 'asc' }, { idFeature: 'asc' }],
    });

    const grouped = new Map<number, typeof rows>();
    for (const row of rows) {
      const list = grouped.get(row.idUser) ?? [];
      list.push(row);
      grouped.set(row.idUser, list);
    }

    for (const [idUser, list] of grouped) {
      const mapped = list
        .map((ff) => mapFeatureFlagRowToDelegatableApi(ff))
        .filter((d) => catalog.validFeatureIds.has(d.id));
      result.set(idUser, orderDelegatableCoachFeatures(mapped));
    }
    return result;
  }

  async create(
    id_account: number,
    actorUserId: number,
    dto: CreateCoachDto,
  ): Promise<CreateUserResponse> {
    const body: CreateUserDto = {
      email: dto.email,
      name: dto.name,
      last_name: dto.last_name,
      role: UserRole.coach,
      phone: dto.phone,
      emergency_phone: dto.emergency_phone,
      observations: dto.observations,
    };
    return this.usersService.createUserWithProfile(
      body,
      id_account,
      actorUserId,
    );
  }

  async findOne(id_user: number, id_account: number, actor: JwtPayload) {
    const row = await this.sharedUsers.findOneByIdAndRole(
      id_user,
      id_account,
      UserRole.coach,
    );
    if (!row) {
      throw new NotFoundException('COACHES.ERRORS.NOT_FOUND');
    }

    const isOwner = this.isActorOwner(actor);
    let delegatableFeatures: DelegatableCoachFeatureApi[] | null = null;
    if (isOwner) {
      const catalog = await loadCoachDelegatableFeatureCatalog(this.prisma);
      const flags = await this.prisma.featureFlag.findMany({
        where: {
          idUser: id_user,
          status: { not: GenericStatus.deleted },
          feature: {
            role: UserRole.coach,
            customizable: true,
            status: { not: GenericStatus.deleted },
          },
        },
        include: { feature: true },
        orderBy: { idFeature: 'asc' },
      });
      delegatableFeatures = orderDelegatableCoachFeatures(
        flags
          .map((ff) => mapFeatureFlagRowToDelegatableApi(ff))
          .filter((d) => catalog.validFeatureIds.has(d.id)),
      );
    }

    return { ...row, delegatableFeatures };
  }

  async update(
    id_user: number,
    id_account: number,
    dto: UpdateCoachDto,
    actor: JwtPayload,
  ) {
    const { delegated_features, ...rest } = dto;
    const row = await this.sharedUsers.updateUser(
      id_user,
      id_account,
      UserRole.coach,
      rest as UpdateUserDto,
    );
    if (!row) {
      throw new NotFoundException('COACHES.ERRORS.NOT_FOUND');
    }
    if (delegated_features != null && delegated_features.length > 0) {
      await this.applyDelegatedCoachFeatures(
        id_user,
        actor.role,
        delegated_features,
      );
    }
    return row;
  }

  /**
   * Owner-only: upserts coach `feature_flags` for customizable coach features
   * from the master catalog. Parent `inactive` cascades to children present in
   * the same payload.
   */
  private async applyDelegatedCoachFeatures(
    coachIdUser: number,
    actorRole: UserRole,
    items: CoachDelegatedFeatureItemDto[],
  ): Promise<void> {
    if (actorRole !== UserRole.owner) {
      throw new ForbiddenException('COACHES.ERRORS.DELEGATION_OWNER_ONLY');
    }
    const seen = new Set<number>();
    for (const row of items) {
      if (seen.has(row.id_feature)) {
        throw new BadRequestException(
          'COACHES.ERRORS.INVALID_DELEGATED_FEATURE_PAYLOAD',
        );
      }
      seen.add(row.id_feature);
    }
    const catalog = await loadCoachDelegatableFeatureCatalog(this.prisma);
    for (const row of items) {
      if (!catalog.validFeatureIds.has(row.id_feature)) {
        throw new BadRequestException(
          'COACHES.ERRORS.INVALID_DELEGATED_FEATURE_ID',
        );
      }
    }
    const statusByFeatureId = new Map<number, GenericStatus>();
    for (const item of items) {
      statusByFeatureId.set(item.id_feature, item.status as GenericStatus);
    }
    applyCoachDelegatedParentInactiveCascade(
      statusByFeatureId,
      catalog.parentIdByFeatureId,
    );
    const ops = [...statusByFeatureId.entries()].map(([idFeature, status]) =>
      this.prisma.featureFlag.upsert({
        where: {
          idUser_idFeature: {
            idUser: coachIdUser,
            idFeature,
          },
        },
        create: {
          idUser: coachIdUser,
          idFeature,
          status,
        },
        update: { status },
      }),
    );
    await this.prisma.$transaction(ops);
  }

  async remove(
    id_user: number,
    id_account: number,
    actor_user_id: number,
  ) {
    const ok = await this.sharedUsers.softDeleteUser(
      id_user,
      id_account,
      UserRole.coach,
      actor_user_id,
    );
    if (!ok) {
      throw new NotFoundException('COACHES.ERRORS.NOT_FOUND');
    }
    return { deleted: true };
  }

  async recover(id_user: number, id_account: number) {
    const ok = await this.sharedUsers.recoverSoftDeletedUser(
      id_user,
      id_account,
      UserRole.coach,
    );
    if (!ok) {
      throw new NotFoundException('COACHES.ERRORS.NOT_FOUND');
    }
    return { recovered: true };
  }

  async getAssignedCustomers(id_user: number, id_account: number) {
    const coach = await this.prisma.user.findFirst({
      where: {
        idUser: id_user,
        idAccount: id_account,
        role: UserRole.coach,
        status: { in: [GenericStatus.active, GenericStatus.deleted] },
      },
      select: { idUser: true },
    });
    if (!coach) {
      throw new NotFoundException('COACHES.ERRORS.NOT_FOUND');
    }
    const rows = await this.prisma.user.findMany({
      where: {
        idAccount: id_account,
        role: UserRole.customer,
        status: GenericStatus.active,
        profile: {
          idCoach: id_user,
        },
      },
      select: {
        idUser: true,
        email: true,
        profile: {
          select: {
            name: true,
            lastName: true,
          },
        },
      },
      orderBy: { idUser: 'asc' },
    });
    return rows.map((r) => toAssignedCustomerRowDto(r));
  }
}
