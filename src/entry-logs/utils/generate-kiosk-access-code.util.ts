/** Generates a random 6-digit kiosk access code formatted as XXX-XXX. */
export function generateKioskAccessCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return `${code.substring(0, 3)}-${code.substring(3, 6)}`;
}
