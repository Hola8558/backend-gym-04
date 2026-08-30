import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { WhatsAppConnectionStatus } from '../types/whatsapp-connection-status.type';

export class WhatsappStatusResponseDto {
  @Expose()
  @ApiProperty({
    enum: ['UNLINKED', 'CONNECTED', 'PAIRING', 'FAILED'],
    example: 'UNLINKED',
  })
  status: WhatsAppConnectionStatus;
}
