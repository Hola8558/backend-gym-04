import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SoftDeleteAccountResponseDto {
  @Expose()
  @ApiProperty()
  id_account: number;

  @Expose()
  @ApiProperty()
  already_deleted: boolean;
}
