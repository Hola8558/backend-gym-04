export function resolveBulkImportEmailCandidate(
  baseEmail: string,
  attempt: number,
): string {
  if (attempt <= 0) {
    return baseEmail;
  }

  const at = baseEmail.indexOf('@');
  if (at <= 0) {
    return `${baseEmail}.import${attempt}`;
  }

  const local = baseEmail.slice(0, at);
  const domain = baseEmail.slice(at + 1);
  return `${local}+import${attempt}@${domain}`;
}
