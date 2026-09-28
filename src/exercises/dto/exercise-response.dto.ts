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
  @ApiProperty({ nullable: true })
  name_es: string | null;

  @Expose()
  @ApiProperty({ enum: MuscularGroup })
  muscular_group: MuscularGroup;

  @Expose()
  @ApiProperty({ nullable: true })
  description: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  description_es: string | null;

  @Expose()
  @ApiProperty({ type: [String] })
  aliases: string[];

  @Expose()
  @ApiProperty({ nullable: true, description: 'snake_case, e.g. olympic_weightlifting' })
  category: string | null;

  @Expose()
  @ApiProperty({ nullable: true, description: 'snake_case, e.g. e_z_curl_bar' })
  equipment: string | null;

  @Expose()
  @ApiProperty({ nullable: true, description: 'pull | push | static' })
  force: string | null;

  @Expose()
  @ApiProperty({ nullable: true, description: 'compound | isolation' })
  mechanic: string | null;

  @Expose()
  @ApiProperty({ nullable: true, description: 'beginner | intermediate | expert' })
  level: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  url: string | null;
}
