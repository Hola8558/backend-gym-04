import { plainToInstance } from 'class-transformer';
import { ResourceCategoryResponseDto } from '../dto/resource-category-response.dto';
import type { ResourceCategoryRow } from '../types/resource-category-row.type';

export function toResourceCategoryResponse(
  row: ResourceCategoryRow,
): ResourceCategoryResponseDto {
  return plainToInstance(
    ResourceCategoryResponseDto,
    {
      idResourcesCategories: row.idResourcesCategories,
      categoryName: row.name,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      editedAt: row.editedAt.toISOString(),
      resources: row.media.map((item) => ({
        idResourcesMedia: item.idResourcesMedia,
        title: item.title,
        description: item.description,
        url: item.link,
        createdAt: item.createdAt.toISOString(),
        editedAt: item.editedAt.toISOString(),
      })),
    },
    { excludeExtraneousValues: true },
  );
}
