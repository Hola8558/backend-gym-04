import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class CustomerListFocusQueryDto {
  @IsIn(['expired', 'deleted', 'banned'])
  kind!: 'expired' | 'deleted' | 'banned';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_user!: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
