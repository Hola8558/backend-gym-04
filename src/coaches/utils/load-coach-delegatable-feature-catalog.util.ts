import { GenericStatus, UserRole, type PrismaClient } from '@prisma/client';

export type CoachDelegatableFeatureCatalog = Readonly<{
  parentIdByFeatureId: ReadonlyMap<number, number | null>;
  validFeatureIds: ReadonlySet<number>;
}>;

/**
 * Master catalog: coach-role, customizable features the owner may delegate
 * (aligned with GET `delegatableFeatures` without relying on the owner's flags).
 */
export async function loadCoachDelegatableFeatureCatalog(
  prisma: Pick<PrismaClient, 'feature'>,
): Promise<CoachDelegatableFeatureCatalog> {
  const rows = await prisma.feature.findMany({
    where: {
      role: UserRole.coach,
      status: { not: GenericStatus.deleted },
      customizable: true,
    },
    select: {
      idFeature: true,
      idFeatureParent: true,
    },
  });
  const parentIdByFeatureId = new Map<number, number | null>();
  for (const row of rows) {
    parentIdByFeatureId.set(row.idFeature, row.idFeatureParent);
  }
  return {
    parentIdByFeatureId,
    validFeatureIds: new Set(rows.map((r) => r.idFeature)),
  };
}
