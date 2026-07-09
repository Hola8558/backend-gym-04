import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';
import type { EmailProvider } from './interfaces/email-provider.interface';
import type { EmailAction } from './types/email-action.type';

const DEFAULT_LANGUAGE = 'es';

/**
 * Resend template IDs live ONLY in this adapter.
 * Core services must never reference these string IDs.
 */
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

/**
 * Isolated Resend adapter. Auth and other core services depend only on EmailProvider.
 * Deleting this file must not break the rest of the app if another adapter is bound.
 */
@Injectable()
export class ResendEmailService implements EmailProvider {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(
    action: EmailAction,
    language: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
      throw new InternalServerErrorException('AUTH.ERRORS.EMAIL_SEND_FAILED');
    }

    const templateId = this.resolveTemplateId(action, language);
    const to = this.requireString(data, 'email');
    const variables = this.mapTemplateVariables(action, data);

    try {
      const response = await this.resend.emails.send({
        to,
        template: {
          id: templateId,
          variables,
        },
      });

      if (response.error) {
        throw new InternalServerErrorException('AUTH.ERRORS.EMAIL_SEND_FAILED');
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('AUTH.ERRORS.EMAIL_SEND_FAILED');
    }
  }

  private resolveTemplateId(action: EmailAction, language: string): string {
    const normalized = language.trim().toLowerCase();
    const byAction = templateMap[action];
    return byAction[normalized as 'en' | 'es'] ?? byAction[DEFAULT_LANGUAGE];
  }

  private mapTemplateVariables(
    action: EmailAction,
    data: Record<string, unknown>,
  ): Record<string, string | number> {
    if (action === 'PASSWORD_RESET') {
      return {
        email_user: this.requireString(data, 'email'),
        new_password: this.requirePassword(data, 'password'),
        user_name: this.requireString(data, 'userName'),
      };
    }

    if (action === 'WELCOME_OWNER') {
      return {
        email_user: this.requireString(data, 'email'),
        new_password: this.requirePassword(data, 'password'),
        user_name: this.requireString(data, 'userName'),
      };
    }

    return {};
  }

  private requireString(data: Record<string, unknown>, key: string): string {
    const value = data[key];
    if (typeof value !== 'string' || value.trim() === '') {
      throw new InternalServerErrorException('AUTH.ERRORS.EMAIL_SEND_FAILED');
    }
    return value.trim();
  }

  /** Password must not be trimmed — special chars are part of the credential. */
  private requirePassword(data: Record<string, unknown>, key: string): string {
    const value = data[key];
    if (typeof value !== 'string' || value.length === 0) {
      throw new InternalServerErrorException('AUTH.ERRORS.EMAIL_SEND_FAILED');
    }
    return value;
  }
}
