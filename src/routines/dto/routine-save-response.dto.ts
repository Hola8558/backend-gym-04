import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RoutineSaveResponseDto {
  @Expose()
  @ApiProperty()
  statusCode: number;

  @Expose()
  @ApiProperty()
  message: string;
}
