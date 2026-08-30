import { SetMetadata } from '@nestjs/common';

export interface AccessRequirements {
  features?: string[];
  roles?: string[];
}

export const REQUIRE_ACCESS_KEY = 'requireAccess';

export const RequireAccess = (requirements: AccessRequirements) =>
  SetMetadata(REQUIRE_ACCESS_KEY, requirements);
