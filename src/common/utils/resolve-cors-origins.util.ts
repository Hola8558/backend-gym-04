import {
  LOCAL_CORS_ORIGIN_PATTERNS,
  PRODUCTION_CORS_ORIGINS,
} from '../constants/cors-origins.const';

export function resolveCorsOrigins(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): (string | RegExp)[] {
  if (nodeEnv === 'production') {
    return [...PRODUCTION_CORS_ORIGINS];
  }
  return [...PRODUCTION_CORS_ORIGINS, ...LOCAL_CORS_ORIGIN_PATTERNS];
}
