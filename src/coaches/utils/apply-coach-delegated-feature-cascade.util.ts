import { GenericStatus } from '@prisma/client';

/**
 * If a parent feature in the payload is `inactive`, every descendant feature
 * that also appears in the payload is forced to `inactive`. Parents that are
 * `active` leave child statuses unchanged.
 */
export function applyCoachDelegatedParentInactiveCascade(
  statusByFeatureId: Map<number, GenericStatus>,
  parentIdByFeatureId: ReadonlyMap<number, number | null>,
): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const [featureId, status] of statusByFeatureId) {
      if (status === GenericStatus.inactive) {
        continue;
      }
      const parentId = parentIdByFeatureId.get(featureId);
      if (parentId == null) {
        continue;
      }
      if (!statusByFeatureId.has(parentId)) {
        continue;
      }
      if (statusByFeatureId.get(parentId) === GenericStatus.inactive) {
        statusByFeatureId.set(featureId, GenericStatus.inactive);
        changed = true;
      }
    }
  }
}
