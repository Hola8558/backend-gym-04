import { ApiProperty } from '@nestjs/swagger';
import { CrowdmeterDay, Prisma } from '@prisma/client';
import { Expose } from 'class-transformer';

export class CrowdmeterResponseDto {
  @Expose()
  @ApiProperty({ enum: CrowdmeterDay, example: CrowdmeterDay.mon })
  identifier: CrowdmeterDay;

  @Expose()
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    example: {
      '12am': 0,
      '2am': 0,
      '4am': 2,
      '6am': 22,
      '8am': 31,
      '10am': 45,
      '12pm': 15,
      '2pm': 22,
      '4pm': 35,
      '6pm': 80,
      '8pm': 50,
      '10pm': 10,
    },
  })
  data: Prisma.JsonValue;
}
