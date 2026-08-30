import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SendWhatsappDocumentResponseDto {
  @Expose()
  @ApiProperty({ example: true })
  ok: boolean;
}
