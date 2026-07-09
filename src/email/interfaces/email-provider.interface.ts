import type { EmailAction } from '../types/email-action.type';

export interface EmailProvider {
  sendEmail(
    action: EmailAction,
    language: string,
    data: Record<string, unknown>,
  ): Promise<void>;
}
