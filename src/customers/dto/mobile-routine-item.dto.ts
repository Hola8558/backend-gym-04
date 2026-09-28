import { ApiProperty } from '@nestjs/swagger';
import type { MobileRoutineWeekData } from '../../routines/types/mobile-routine-week-data.type';

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
    description:
      'week + Lun..Dom (null = not planned, [] = empty). Items are `standalone_exercise` or `circuit`; ' +
      'each exercise carries catalog fields (name/name_es, description/description_es, aliases, ' +
      'snake_case facets, muscular_group, url folder ending in "/") plus series/reps/weight{weight,isKg}/' +
      'notes/exc/conc/iso. Unset fields are omitted, never "".',
  })
  data!: MobileRoutineWeekData;
}
