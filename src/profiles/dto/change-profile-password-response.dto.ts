import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ChangeProfilePasswordResponseDto {
  @Expose()
  @ApiProperty({ example: 'PROFILE.CHANGE_PASSWORD.SUCCESS' })
  message: string;
}
