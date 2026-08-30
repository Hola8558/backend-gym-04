import { SetMetadata } from '@nestjs/common';

export const REQUIRE_FEATURE_KEY = 'requireFeature';

/**
 * Requires at least one active `feature_flags` row for any of the given feature IDs
 * (OR). Owners bypass in {@link FeatureGuard}; coaches and solo coaches must have a matching active flag.
 */
export const RequireFeature = (...featureIds: number[]) =>
  SetMetadata(REQUIRE_FEATURE_KEY, featureIds);
