import type { Prisma } from '@prisma/client';
import type { DelegatableCoachFeatureApi } from '../types/delegatable-coach-feature-api.type';

export type FeatureFlagWithFeature = Prisma.FeatureFlagGetPayload<{
  include: { feature: true };
}>;

function parseDescriptionKeys(
  description: Prisma.JsonValue | null,
  featureName: string | null,
): { titleKey: string; descriptionKey: string } {
  const fallback = {
    titleKey: 'SETTINGS.UNKNOWN_TITLE',
    descriptionKey: 'SETTINGS.UNKNOWN_DESC',
  };

  const tryObject = (o: unknown): { titleKey: string; descriptionKey: string } | null => {
    if (o == null || typeof o !== 'object' || Array.isArray(o)) {
      return null;
    }
    const rec = o as Record<string, unknown>;
    const titleKey = rec['title'];
    const descKey = rec['description'];
    if (typeof titleKey === 'string' && typeof descKey === 'string') {
      return { titleKey, descriptionKey: descKey };
    }
    return null;
  };

  const fromJson = tryObject(description);
  if (fromJson) {
    return fromJson;
  }

  if (typeof description === 'string' && description.trim() !== '') {
    try {
      const parsed = JSON.parse(description) as unknown;
      const fromParsed = tryObject(parsed);
      if (fromParsed) {
        return fromParsed;
      }
    } catch {
      /* ignore */
    }
  }

  if (typeof featureName === 'string' && featureName.trim() !== '') {
    const k = featureName.trim();
    return { titleKey: k, descriptionKey: k };
  }

  return fallback;
}

export function mapFeatureFlagRowToDelegatableApi(
  ff: FeatureFlagWithFeature,
): DelegatableCoachFeatureApi {
  const keys = parseDescriptionKeys(
    ff.feature.description,
    ff.feature.name,
  );
  return {
    id: ff.idFeature,
    status: ff.status,
    parentId: ff.feature.idFeatureParent ?? null,
    titleKey: keys.titleKey,
    descriptionKey: keys.descriptionKey,
  };
}

/** Parents before dependents when parent id is present in the same payload. */
export function orderDelegatableCoachFeatures(
  items: DelegatableCoachFeatureApi[],
): DelegatableCoachFeatureApi[] {
  const idSet = new Set(items.map((i) => i.id));
  const byId = new Map(items.map((i) => [i.id, i]));
  const remaining = new Set(items.map((i) => i.id));
  const ordered: DelegatableCoachFeatureApi[] = [];

  while (remaining.size > 0) {
    let progressed = false;
    for (const id of [...remaining]) {
      const item = byId.get(id)!;
      const pid = item.parentId;
      const parentMissing = pid != null && !idSet.has(pid);
      const parentStillQueued = pid != null && remaining.has(pid);
      if (parentStillQueued && !parentMissing) {
        continue;
      }
      ordered.push(item);
      remaining.delete(id);
      progressed = true;
    }
    if (!progressed) {
      for (const id of [...remaining]) {
        ordered.push(byId.get(id)!);
        remaining.delete(id);
      }
    }
  }
  return ordered;
}
