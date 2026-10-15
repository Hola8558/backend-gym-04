/** Public web frontends; always allowed. */
export const PRODUCTION_CORS_ORIGINS: readonly string[] = [
  'https://technolo-g.mx',
  'https://www.technolo-g.mx',
];

/** Local dev servers on any port (ng serve, Flutter web, etc.); skipped when NODE_ENV=production. */
export const LOCAL_CORS_ORIGIN_PATTERNS: readonly RegExp[] = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];
