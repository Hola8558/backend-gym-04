import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../core/prisma/prisma.service';
import { WHATSAPP_PROVIDER } from './constants/whatsapp-provider.token';
import { SendWhatsappDocumentDto } from './dto/send-whatsapp-document.dto';
import { SendWhatsappDocumentResponseDto } from './dto/send-whatsapp-document-response.dto';
import { UpdateWhatsappTemplatesDto } from './dto/update-whatsapp-templates.dto';
import { WhatsappQrResponseDto } from './dto/whatsapp-qr-response.dto';
import { WhatsappStatusResponseDto } from './dto/whatsapp-status-response.dto';
import { WhatsappTemplatesResponseDto } from './dto/whatsapp-templates-response.dto';
import type { WhatsAppProvider } from './interfaces/whatsapp-provider.interface';

const PAIRING_STATES = new Set(['connecting', 'pairing', 'qr']);

@Injectable()
export class WhatsappService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WHATSAPP_PROVIDER)
    private readonly whatsAppProvider: WhatsAppProvider,
  ) {}

  /**
   * Status rules:
   * - no UUID → UNLINKED
   * - Evolution `open` → CONNECTED
   * - Evolution pairing/connecting → PAIRING (do NOT delete; QR may be active)
   * - missing instance / close / other → cleanup Evolution, keep UUID, FAILED
   */
  async getStatus(idAccount: number): Promise<WhatsappStatusResponseDto> {
    const detail = await this.findAccountDetail(idAccount);
    const identifier = detail.wspIdentifier;

    if (!identifier) {
      return this.toStatusDto('UNLINKED');
    }

    let state: string;
    try {
      state = await this.whatsAppProvider.checkConnectionState(identifier);
    } catch {
      await this.safeDeleteSession(identifier);
      return this.toStatusDto('FAILED');
    }

    if (state === 'open') {
      return this.toStatusDto('CONNECTED');
    }

    if (PAIRING_STATES.has(state)) {
      return this.toStatusDto('PAIRING');
    }

    // `missing` / `close` / unknown dead states — purge Evolution leftovers only.
    if (state !== 'missing') {
      await this.safeDeleteSession(identifier);
    }

    return this.toStatusDto('FAILED');
  }

  /**
   * Always wipe any Evolution leftovers for this identifier before creating a
   * fresh QR instance (reconnect-safe).
   */
  async generateQr(idAccount: number): Promise<WhatsappQrResponseDto> {
    const detail = await this.findAccountDetail(idAccount);
    let identifier = detail.wspIdentifier;

    if (!identifier) {
      identifier = randomUUID();
      await this.prisma.accountDetail.update({
        where: { idAccount },
        data: { wspIdentifier: identifier },
      });
    }

    await this.safeDeleteSession(identifier);
    await this.delay(400);

    const qrBase64 = await this.whatsAppProvider.generateQrCode(identifier);
    return plainToInstance(
      WhatsappQrResponseDto,
      { qrBase64 },
      { excludeExtraneousValues: true },
    );
  }

  async getTemplates(idAccount: number): Promise<WhatsappTemplatesResponseDto> {
    const detail = await this.findAccountDetail(idAccount);
    return plainToInstance(
      WhatsappTemplatesResponseDto,
      {
        menuTemplate: detail.menuTemplate,
        routineTemplate: detail.routineTemplate,
      },
      { excludeExtraneousValues: true },
    );
  }

  async updateTemplates(
    idAccount: number,
    dto: UpdateWhatsappTemplatesDto,
  ): Promise<WhatsappTemplatesResponseDto> {
    await this.findAccountDetail(idAccount);

    const data: { menuTemplate?: string; routineTemplate?: string } = {};
    if (dto.menuTemplate !== undefined) {
      data.menuTemplate = dto.menuTemplate;
    }
    if (dto.routineTemplate !== undefined) {
      data.routineTemplate = dto.routineTemplate;
    }

    const updated = await this.prisma.accountDetail.update({
      where: { idAccount },
      data,
      select: {
        menuTemplate: true,
        routineTemplate: true,
      },
    });

    return plainToInstance(
      WhatsappTemplatesResponseDto,
      {
        menuTemplate: updated.menuTemplate,
        routineTemplate: updated.routineTemplate,
      },
      { excludeExtraneousValues: true },
    );
  }

  async sendDocument(
    idAccount: number,
    dto: SendWhatsappDocumentDto,
  ): Promise<SendWhatsappDocumentResponseDto> {
    const detail = await this.findAccountDetail(idAccount);
    const identifier = detail.wspIdentifier;

    if (!identifier) {
      throw new BadRequestException('WHATSAPP.ERRORS.SESSION_UNLINKED');
    }

    try {
      const state = await this.whatsAppProvider.checkConnectionState(identifier);
      if (state !== 'open') {
        if (state !== 'missing') {
          await this.safeDeleteSession(identifier);
        }
        throw new BadRequestException('WHATSAPP.ERRORS.SESSION_NOT_CONNECTED');
      }
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      await this.safeDeleteSession(identifier);
      throw new BadRequestException('WHATSAPP.ERRORS.SESSION_NOT_CONNECTED');
    }

    await this.whatsAppProvider.sendDocument({
      identifier,
      phoneDigits: dto.phone.replace(/\D/g, ''),
      fileName: dto.fileName,
      mediaBase64: dto.mediaBase64,
      caption: dto.caption,
      mimetype: 'application/pdf',
    });

    return plainToInstance(
      SendWhatsappDocumentResponseDto,
      { ok: true },
      { excludeExtraneousValues: true },
    );
  }

  private async safeDeleteSession(identifier: string): Promise<void> {
    try {
      await this.whatsAppProvider.deleteSession(identifier);
    } catch {
      // Keep UUID in DB even if Evolution cleanup partially fails.
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async findAccountDetail(idAccount: number) {
    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount },
      select: {
        idAccountDetail: true,
        wspIdentifier: true,
        menuTemplate: true,
        routineTemplate: true,
      },
    });

    if (!detail) {
      throw new NotFoundException('WHATSAPP.ERRORS.ACCOUNT_DETAIL_NOT_FOUND');
    }

    return detail;
  }

  private toStatusDto(
    status: WhatsappStatusResponseDto['status'],
  ): WhatsappStatusResponseDto {
    return plainToInstance(
      WhatsappStatusResponseDto,
      { status },
      { excludeExtraneousValues: true },
    );
  }
}
