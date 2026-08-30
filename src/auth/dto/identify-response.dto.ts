import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class IdentifyResponseDto {
  @Expose()
  @ApiProperty()
  requires_password_change: boolean;

  @Expose()
  @ApiProperty()
  identifier_hint: string;
}
