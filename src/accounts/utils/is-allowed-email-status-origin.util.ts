import {
  EMAIL_STATUS_DEV_ORIGINS,
  EMAIL_STATUS_PROD_ORIGIN,
  EMAIL_STATUS_PROD_REFERER_PREFIX,
} from '../constants/email-status-allowed-origins.const';

export function isAllowedEmailStatusOrigin(
  origin: string | undefined,
  referer: string | undefined,
): boolean {
  const resolvedOrigin = origin?.trim() ?? '';
  if (
    (EMAIL_STATUS_DEV_ORIGINS as readonly string[]).includes(resolvedOrigin)
  ) {
    return true;
  }

  if (resolvedOrigin !== EMAIL_STATUS_PROD_ORIGIN) {
    return false;
  }

  const resolvedReferer = referer?.trim() ?? '';
  return (
    resolvedReferer === '' ||
    resolvedReferer.startsWith(EMAIL_STATUS_PROD_REFERER_PREFIX)
  );
}
