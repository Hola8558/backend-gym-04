import { ApiProperty } from '@nestjs/swagger';
import { MuscularGroup } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ExerciseResponseDto {
  @Expose()
  @ApiProperty()
  id_exercise: number;

  @Expose()
  @ApiProperty({ nullable: true })
  name: string | null;

  @Expose()
  @ApiProperty({ enum: MuscularGroup })
  muscular_group: MuscularGroup;

  @Expose()
  @ApiProperty({ nullable: true })
  description: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  url: string | null;
}
