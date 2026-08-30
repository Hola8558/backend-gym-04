import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ManualCheckinResponseDto {
  @Expose()
  @ApiProperty({ example: 'success' })
  status!: string;

  @Expose()
  @ApiProperty({ example: 'ACCESS.CHECKIN_RECORDED' })
  message!: string;
}
