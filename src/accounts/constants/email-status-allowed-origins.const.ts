export const EMAIL_STATUS_DEV_ORIGINS = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'http://localhost:5082',
  'http://127.0.0.1:5082',
] as const;

/** Allowed browser Origins for the public email-status endpoint (production). */
export const EMAIL_STATUS_PROD_ORIGINS = [
  'https://technolo-g.mx',
  'https://www.technolo-g.mx',
] as const;

/**
 * Referer must be empty (privacy) or same-site under these prefixes.
 * Strict `/verify-email` only broke when Referer was another technolo-g path
 * (or www vs apex mismatch).
 */
export const EMAIL_STATUS_PROD_REFERER_PREFIXES = [
  'https://technolo-g.mx/',
  'https://www.technolo-g.mx/',
  'https://technolo-g.mx',
  'https://www.technolo-g.mx',
] as const;
