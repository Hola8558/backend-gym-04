import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Resend } from 'resend';
import type { EmailProvider } from './interfaces/email-provider.interface';
import type { EmailAction } from './types/email-action.type';
import { buildPasswordResetFallbackHtml } from './utils/build-password-reset-fallback-html.util';
import { compileEmailTemplate } from './utils/compile-email-template.util';
import {
  resolveHostedTemplateId,
  resolvePasswordResetSubject,
  resolvePasswordResetTemplateFile,
} from './utils/resolve-email-template.util';

const DEFAULT_LANGUAGE = 'es';

/**
 * Isolated Resend adapter. Auth and other core services depend only on EmailProvider.
 * Deleting this file must not break the rest of the app if another adapter is bound.
 */
@Injectable()
export class ResendEmailService implements EmailProvider {
  private readonly logger = new Logger(ResendEmailService.name);
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

    const from = this.resolveFromAddress();
    const normalizedLanguage = this.normalizeLanguage(language);
    const to = this.requireString(data, 'email');

    if (action === 'PASSWORD_RESET') {
      await this.sendPasswordResetEmail(from, to, normalizedLanguage, data);
      return;
    }

    await this.sendHostedTemplateEmail(
      from,
      to,
      action,
      normalizedLanguage,
      data,
    );
  }

  private async sendPasswordResetEmail(
    from: string,
    to: string,
    language: 'en' | 'es',
    data: Record<string, unknown>,
  ): Promise<void> {
    const userName = this.requireString(data, 'userName');
    const password = this.requirePassword(data, 'password');
    const subject = resolvePasswordResetSubject(language);
    const html = this.buildPasswordResetHtml(language, userName, password);

    await this.dispatchEmail({
      from,
      to,
      subject,
      html,
    });
  }

  private buildPasswordResetHtml(
    language: 'en' | 'es',
    userName: string,
    password: string,
  ): string {
    try {
      return compileEmailTemplate(resolvePasswordResetTemplateFile(language), {
        userName,
        password,
      });
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown template error';
      this.logger.warn(
        `Password reset template compile failed (${language}), using HTML fallback: ${reason}`,
      );

      return buildPasswordResetFallbackHtml(language, userName, password);
    }
  }

  private async sendHostedTemplateEmail(
    from: string,
    to: string,
    action: EmailAction,
    language: 'en' | 'es',
    data: Record<string, unknown>,
  ): Promise<void> {
    const templateId = resolveHostedTemplateId(action, language);
    const variables = this.mapHostedTemplateVariables(action, data);

    await this.dispatchEmail({
      from,
      to,
      template: {
        id: templateId,
        variables,
      },
    });
  }

  private async dispatchEmail(
    payload:
      | {
          from: string;
          to: string;
          subject: string;
          html: string;
        }
      | {
          from: string;
          to: string;
          template: {
            id: string;
            variables: Record<string, string | number>;
          };
        },
  ): Promise<void> {
    const diagnosticPayload =
      'html' in payload
        ? {
            from: payload.from,
            to: payload.to,
            subject: payload.subject,
            htmlLength: payload.html.length,
          }
        : {
            from: payload.from,
            to: payload.to,
            template: payload.template,
          };

    console.log('--- DIAGNOSTIC 6 (NEST): ATTEMPTING RESEND API CALL ---');
    console.log(
      `--- DIAGNOSTIC 6b (NEST): PAYLOAD (sanitized) = ${JSON.stringify(diagnosticPayload)} ---`,
    );

    try {
      const resendResponse = await this.resend.emails.send(payload);

      console.log(
        `--- DIAGNOSTIC 7 (NEST): RESEND SUCCESS = ${JSON.stringify(resendResponse)} ---`,
      );

      if (resendResponse.error) {
        console.error(
          `--- DIAGNOSTIC 7b (NEST): RESEND RETURNED ERROR OBJECT = ${JSON.stringify(resendResponse.error)} ---`,
        );
        this.logger.error(
          `Resend API error: ${resendResponse.error.message ?? 'Unknown error'}`,
        );
        throw new InternalServerErrorException('AUTH.ERRORS.EMAIL_SEND_FAILED');
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      const reason = error instanceof Error ? error.message : 'Unknown error';
      console.error(`--- DIAGNOSTIC 8 (NEST): RESEND FAILED = ${reason} ---`);
      if (error instanceof Error && error.stack) {
        console.error(`--- DIAGNOSTIC 8b (NEST): STACK = ${error.stack} ---`);
      }
      this.logger.error(`Resend send failed: ${reason}`);
      throw new InternalServerErrorException('AUTH.ERRORS.EMAIL_SEND_FAILED');
    }
  }

  private resolveFromAddress(): string {
    const from = process.env.RESEND_FROM_EMAIL?.trim();
    if (!from) {
      throw new InternalServerErrorException('AUTH.ERRORS.EMAIL_SEND_FAILED');
    }

    return from;
  }

  private normalizeLanguage(language: string): 'en' | 'es' {
    const normalized = language.trim().toLowerCase();
    return normalized === 'en' ? 'en' : DEFAULT_LANGUAGE;
  }

  private mapHostedTemplateVariables(
    action: EmailAction,
    data: Record<string, unknown>,
  ): Record<string, string | number> {
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
