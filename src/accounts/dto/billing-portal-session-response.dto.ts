import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BillingPortalSessionResponseDto {
  @Expose()
  @ApiProperty()
  url: string;
}
