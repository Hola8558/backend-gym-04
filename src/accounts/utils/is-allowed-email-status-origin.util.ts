import {
  EMAIL_STATUS_DEV_ORIGINS,
  EMAIL_STATUS_PROD_ORIGINS,
  EMAIL_STATUS_PROD_REFERER_PREFIXES,
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

  if (
    !(EMAIL_STATUS_PROD_ORIGINS as readonly string[]).includes(resolvedOrigin)
  ) {
    return false;
  }

  const resolvedReferer = referer?.trim() ?? '';
  if (resolvedReferer === '') {
    return true;
  }

  return (EMAIL_STATUS_PROD_REFERER_PREFIXES as readonly string[]).some(
    (prefix) => resolvedReferer.startsWith(prefix),
  );
}
