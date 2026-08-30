/** Masks an email or user number for display pills (e.g. `co***@gmail.com`, `12***`). */
export function obfuscateIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return obfuscateEmail(trimmed);
  }
  if (trimmed.length <= 2) {
    return `${trimmed.slice(0, 1)}***`;
  }
  return `${trimmed.slice(0, 2)}***`;
}

function obfuscateEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) {
    return email;
  }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).trim();
  if (!domain) {
    return email;
  }
  const prefix = local.length <= 1 ? local.slice(0, 1) : local.slice(0, 2);
  return `${prefix}***@${domain}`;
}
