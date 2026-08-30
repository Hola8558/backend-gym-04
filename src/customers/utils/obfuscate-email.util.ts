/** Masks local part while keeping domain visible e.g. `customer@gmail.com` → `c***r@gmail.com`. */
export function obfuscateEmailForMobile(email: string | null | undefined): string {
  const normalized = email?.trim();
  if (!normalized || !normalized.includes('@')) {
    return '';
  }
  const at = normalized.indexOf('@');
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (local.length === 0 || domain.length === 0) {
    return '';
  }
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
