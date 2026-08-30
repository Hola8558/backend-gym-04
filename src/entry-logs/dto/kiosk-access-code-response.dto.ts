import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class KioskAccessCodeResponseDto {
  @Expose()
  @ApiProperty({ example: '482-917', description: 'Daily kiosk check-in code (XXX-XXX)' })
  access_code!: string;
}
