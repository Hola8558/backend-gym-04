import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WhatsappQrResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Base64 QR image (may include data URL prefix)',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  qrBase64: string;
}
