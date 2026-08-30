import { escapeHtml } from './escape-html.util';

type PasswordResetLanguage = 'en' | 'es';

export function buildPasswordResetFallbackHtml(
  language: PasswordResetLanguage,
  userName: string,
  password: string,
): string {
  const safeUserName = escapeHtml(userName);
  const safePassword = escapeHtml(password);

  if (language === 'es') {
    return `<!DOCTYPE html>
<html lang="es">
  <body style="font-family: Arial, Helvetica, sans-serif; color: #111827;">
    <h1>Restablecer contraseña</h1>
    <p>Hola ${safeUserName},</p>
    <p>Tu contraseña temporal es:</p>
    <p style="font-size: 20px; font-family: Consolas, Monaco, monospace;"><strong>${safePassword}</strong></p>
    <p>Inicia sesión y elige una nueva contraseña de inmediato.</p>
  </body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
  <body style="font-family: Arial, Helvetica, sans-serif; color: #111827;">
    <h1>Password reset</h1>
    <p>Hello ${safeUserName},</p>
    <p>Your temporary password is:</p>
    <p style="font-size: 20px; font-family: Consolas, Monaco, monospace;"><strong>${safePassword}</strong></p>
    <p>Sign in and choose a new password right away.</p>
  </body>
</html>`;
}
