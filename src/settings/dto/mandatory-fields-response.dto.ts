import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MandatoryFieldsResponseDto {
  @Expose()
  @ApiProperty({
    type: [String],
    example: ['name', 'lastname', 'email', 'phone'],
  })
  mandatory_fields!: string[];
}
