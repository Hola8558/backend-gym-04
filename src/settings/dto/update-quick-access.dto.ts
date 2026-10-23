import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { QUICK_ACCESS_NAME_MAX } from '../utils/quick-access.util';

export class UpdateQuickAccessDto {
  @ApiProperty({ example: 'customers.active' })
  @IsString()
  @MaxLength(40)
  @Matches(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/)
  view!: string;

  @ApiProperty({ enum: ['add', 'rename', 'remove', 'pin', 'unpin', 'move'] })
  @IsIn(['add', 'rename', 'remove', 'pin', 'unpin', 'move'])
  action!: 'add' | 'rename' | 'remove' | 'pin' | 'unpin' | 'move';

  @ApiProperty({ required: false, example: 'Activos · Básica' })
  @IsOptional()
  @IsString()
  @MaxLength(QUICK_ACCESS_NAME_MAX)
  name?: string;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  filters?: Record<string, string | number | boolean | null>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  id?: string;

  @ApiProperty({ required: false, enum: ['up', 'down'] })
  @IsOptional()
  @IsIn(['up', 'down'])
  direction?: 'up' | 'down';
}
