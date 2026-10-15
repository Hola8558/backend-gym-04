import type { Type } from '@nestjs/common';

/**
 * Registers `src/dev-tools` (git-ignored, local only) when present.
 * Missing folder or NODE_ENV=production → no extra modules.
 */
export function loadLocalDevModules(): Type<unknown>[] {
  if (process.env.NODE_ENV === 'production') {
    return [];
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const devTools = require('../../dev-tools/dev-tools.module') as {
      DevToolsModule?: Type<unknown>;
    };
    return devTools.DevToolsModule ? [devTools.DevToolsModule] : [];
  } catch {
    return [];
  }
}
