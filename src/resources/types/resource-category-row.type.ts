import { Prisma } from '@prisma/client';

export type ResourceCategoryRow = Prisma.CategoryGetPayload<{
  include: { media: true };
}>;
