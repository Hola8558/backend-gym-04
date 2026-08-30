import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WhatsAppProvider } from '../interfaces/whatsapp-provider.interface';
import type { WhatsAppSendDocumentParams } from '../types/whatsapp-send-document.params';

/**
 * Isolated Evolution API adapter.
 * Feature services depend only on WhatsAppProvider.
 */
@Injectable()
export class EvolutionApiAdapter implements WhatsAppProvider {
  private readonly logger = new Logger(EvolutionApiAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async checkConnectionState(identifier: string): Promise<string> {
    const response = await this.request(
      'GET',
      `/instance/connectionState/${encodeURIComponent(identifier)}`,
      undefined,
      { treatNotFoundAsNull: true },
    );

    if (response == null) {
      // Instance absent in Evolution — not an error; caller decides next step.
      return 'missing';
    }

    const state =
      this.readString(response, ['instance', 'state']) ??
      this.readString(response, ['state']) ??
      this.readString(response, ['connectionState']);

    if (!state) {
      throw new BadGatewayException('WHATSAPP.ERRORS.STATE_UNKNOWN');
    }

    return state.toLowerCase();
  }

  async generateQrCode(identifier: string): Promise<string> {
    const response = await this.request('POST', '/instance/create', {
      instanceName: identifier,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });

    const base64 =
      this.readString(response, ['qrcode', 'base64']) ??
      this.readString(response, ['qrcode', 'base64Encoded']) ??
      this.readString(response, ['base64']);

    if (!base64) {
      throw new BadGatewayException('WHATSAPP.ERRORS.QR_MISSING');
    }

    return base64;
  }

  async deleteSession(identifier: string): Promise<void> {
    await this.requestIgnoreNotFound(
      'DELETE',
      `/instance/logout/${encodeURIComponent(identifier)}`,
    );
    await this.requestIgnoreNotFound(
      'DELETE',
      `/instance/delete/${encodeURIComponent(identifier)}`,
    );
  }

  async sendDocument(params: WhatsAppSendDocumentParams): Promise<void> {
    const media = this.stripDataUrlPrefix(params.mediaBase64);
    if (!media) {
      throw new BadGatewayException('WHATSAPP.ERRORS.MEDIA_INVALID');
    }

    await this.request(
      'POST',
      `/message/sendMedia/${encodeURIComponent(params.identifier)}`,
      {
        number: params.phoneDigits.replace(/\D/g, ''),
        mediatype: 'document',
        mimetype: params.mimetype ?? 'application/pdf',
        fileName: params.fileName,
        media,
        ...(params.caption ? { caption: params.caption } : {}),
      },
    );
  }

  private stripDataUrlPrefix(value: string): string {
    const trimmed = value.trim();
    const comma = trimmed.indexOf(',');
    if (trimmed.startsWith('data:') && comma >= 0) {
      return trimmed.slice(comma + 1);
    }
    return trimmed;
  }

  private resolveConfig(): { baseUrl: string; apiKey: string } {
    const baseUrl = this.configService
      .get<string>('EVOLUTION_API_BASE_URL')
      ?.trim()
      .replace(/\/+$/, '');
    const apiKey = this.configService.get<string>('EVOLUTION_API_KEY')?.trim();

    if (!baseUrl || !apiKey) {
      throw new InternalServerErrorException(
        'WHATSAPP.ERRORS.PROVIDER_MISCONFIGURED',
      );
    }

    return { baseUrl, apiKey };
  }

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    options?: { treatNotFoundAsNull?: boolean },
  ): Promise<unknown> {
    const { baseUrl, apiKey } = this.resolveConfig();
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          apikey: apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      this.logger.error(`Evolution request failed: ${method} ${path}`, err);
      throw new BadGatewayException('WHATSAPP.ERRORS.PROVIDER_UNAVAILABLE');
    }

    if (response.status === 404 && options?.treatNotFoundAsNull) {
      return null;
    }

    if (!response.ok) {
      this.logger.warn(
        `Evolution ${method} ${path} → ${response.status} ${response.statusText}`,
      );
      throw new BadGatewayException('WHATSAPP.ERRORS.PROVIDER_REQUEST_FAILED');
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  private async requestIgnoreNotFound(
    method: string,
    path: string,
  ): Promise<void> {
    const { baseUrl, apiKey } = this.resolveConfig();
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          apikey: apiKey,
          Accept: 'application/json',
        },
      });

      if (response.ok || response.status === 404) {
        return;
      }

      this.logger.warn(
        `Evolution cleanup ${method} ${path} → ${response.status}`,
      );
    } catch (err) {
      this.logger.warn(
        `Evolution cleanup failed (ignored): ${method} ${path}`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  private readString(
    payload: unknown,
    path: string[],
  ): string | null {
    let current: unknown = payload;
    for (const key of path) {
      if (current == null || typeof current !== 'object') {
        return null;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return typeof current === 'string' && current.length > 0 ? current : null;
  }
}
