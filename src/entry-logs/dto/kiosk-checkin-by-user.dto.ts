import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class KioskCheckinByUserDto {
  @ApiProperty({ description: 'idUser from a kiosk search/preview result' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_user: number;
}
