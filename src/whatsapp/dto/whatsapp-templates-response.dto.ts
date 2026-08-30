import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WhatsappTemplatesResponseDto {
  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Raw menu caption template (null when unset in DB)',
  })
  menuTemplate: string | null;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Raw routine caption template (null when unset in DB)',
  })
  routineTemplate: string | null;
}
