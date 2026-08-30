import { BadRequestException, Injectable } from '@nestjs/common';
import { GenericStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { ResourceCategoryResponseDto } from './dto/resource-category-response.dto';
import { SaveResourceCategoryDto } from './dto/save-resource-category.dto';
import type { ResourceCategoryRow } from './types/resource-category-row.type';
import { toResourceCategoryResponse } from './utils/resource-response.mapper';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(idAccount: number): Promise<ResourceCategoryResponseDto[]> {
    const rows = await this.prisma.category.findMany({
      where: {
        idAccount,
        status: { not: GenericStatus.deleted },
      },
      include: {
        media: {
          where: { status: { not: GenericStatus.deleted } },
          orderBy: { idResourcesMedia: 'asc' },
        },
      },
      orderBy: { idResourcesCategories: 'asc' },
    });

    return rows.map(toResourceCategoryResponse);
  }

  async saveAll(
    idAccount: number,
    categories: SaveResourceCategoryDto[],
  ): Promise<ResourceCategoryResponseDto[]> {
    await this.prisma.$transaction(async (tx) => {
      const existingCategories = await tx.category.findMany({
        where: {
          idAccount,
          status: { not: GenericStatus.deleted },
        },
        include: {
          media: {
            where: { status: { not: GenericStatus.deleted } },
          },
        },
      });

      this.assertValidIds(categories, existingCategories);
      const incomingCategoryIds = new Set(
        categories.flatMap((category) =>
          category.idResourcesCategories == null
            ? []
            : [category.idResourcesCategories],
        ),
      );

      for (const category of categories) {
        await this.saveCategory(tx, idAccount, category, existingCategories);
      }

      for (const existingCategory of existingCategories) {
        if (incomingCategoryIds.has(existingCategory.idResourcesCategories)) {
          continue;
        }
        if (existingCategory.media.length > 0) {
          throw new BadRequestException('RESOURCES.ERRORS.CATEGORY_HAS_ITEMS');
        }
        await tx.category.update({
          where: {
            idResourcesCategories: existingCategory.idResourcesCategories,
            idAccount,
          },
          data: { status: GenericStatus.deleted },
        });
      }
    });

    return this.findAll(idAccount);
  }

  private async saveCategory(
    tx: Prisma.TransactionClient,
    idAccount: number,
    category: SaveResourceCategoryDto,
    existingCategories: ResourceCategoryRow[],
  ): Promise<void> {
    const categoryId =
      category.idResourcesCategories ??
      (
        await tx.category.create({
          data: {
            idAccount,
            name: category.categoryName.trim(),
            description: this.normalizeOptionalText(category.description),
            status: GenericStatus.active,
          },
        })
      ).idResourcesCategories;

    if (category.idResourcesCategories != null) {
      await tx.category.update({
        where: {
          idResourcesCategories: category.idResourcesCategories,
          idAccount,
        },
        data: {
          name: category.categoryName.trim(),
          description: this.normalizeOptionalText(category.description),
        },
      });
    }

    const existingMedia =
      existingCategories.find(
        (row) => row.idResourcesCategories === category.idResourcesCategories,
      )?.media ?? [];
    const incomingMediaIds = new Set(
      category.resources.flatMap((resource) =>
        resource.idResourcesMedia == null
          ? []
          : [resource.idResourcesMedia],
      ),
    );

    for (const resource of category.resources) {
      const data = {
        title: resource.title.trim(),
        description: this.normalizeOptionalText(resource.description),
        link: resource.url.trim(),
      };
      if (resource.idResourcesMedia == null) {
        await tx.media.create({
          data: {
            categoryId,
            ...data,
            status: GenericStatus.active,
          },
        });
      } else {
        await tx.media.update({
          where: {
            idResourcesMedia: resource.idResourcesMedia,
            category: { idAccount },
          },
          data,
        });
      }
    }

    for (const media of existingMedia) {
      if (!incomingMediaIds.has(media.idResourcesMedia)) {
        await tx.media.update({
          where: { idResourcesMedia: media.idResourcesMedia },
          data: { status: GenericStatus.deleted },
        });
      }
    }
  }

  private assertValidIds(
    categories: SaveResourceCategoryDto[],
    existingCategories: Array<{
      idResourcesCategories: number;
      media: Array<{ idResourcesMedia: number }>;
    }>,
  ): void {
    const existingById = new Map(
      existingCategories.map((category) => [
        category.idResourcesCategories,
        category,
      ]),
    );
    const seenCategoryIds = new Set<number>();
    const seenMediaIds = new Set<number>();

    for (const category of categories) {
      const categoryId = category.idResourcesCategories;
      const existing =
        categoryId == null ? undefined : existingById.get(categoryId);
      if (categoryId != null && (!existing || seenCategoryIds.has(categoryId))) {
        throw new BadRequestException('RESOURCES.ERRORS.INVALID_CATEGORY');
      }
      if (categoryId != null) {
        seenCategoryIds.add(categoryId);
      }

      const validMediaIds = new Set(
        existing?.media.map((media) => media.idResourcesMedia) ?? [],
      );
      for (const resource of category.resources) {
        const mediaId = resource.idResourcesMedia;
        if (
          mediaId != null &&
          (!validMediaIds.has(mediaId) || seenMediaIds.has(mediaId))
        ) {
          throw new BadRequestException('RESOURCES.ERRORS.INVALID_MEDIA');
        }
        if (mediaId != null) {
          seenMediaIds.add(mediaId);
        }
      }
    }
  }

  private normalizeOptionalText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
