import type { EmailAction } from '../types/email-action.type';

const PASSWORD_RESET_SUBJECTS: Record<'en' | 'es', string> = {
  en: 'Your new password',
  es: 'Tu nueva contraseña',
};

export function resolvePasswordResetTemplateFile(
  language: 'en' | 'es',
): string {
  return `password-reset.${language}.html`;
}

export function resolvePasswordResetSubject(language: 'en' | 'es'): string {
  return PASSWORD_RESET_SUBJECTS[language];
}

export function resolveHostedTemplateId(
  action: EmailAction,
  language: 'en' | 'es',
): string {
  const templateMap: Record<EmailAction, Record<'en' | 'es', string>> = {
    PASSWORD_RESET: {
      en: 'password-reset-en',
      es: 'password-reset-es',
    },
    WELCOME_OWNER: {
      en: 'welcome-email-en',
      es: 'welcome-email-es',
    },
  };

  return templateMap[action][language];
}
