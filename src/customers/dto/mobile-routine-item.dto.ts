import { ApiProperty } from '@nestjs/swagger';

/** Single routine week payload returned to mobile (login + sync). */
export class MobileRoutineItemDto {
  @ApiProperty()
  id_routine!: number;

  @ApiProperty({
    description: 'Last modification time (ISO 8601)',
    example: '2026-05-28T12:00:00.000Z',
  })
  edited_at!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Hydrated weekly plan JSON (week + Lun..Dom)',
  })
  data!: unknown;
}
