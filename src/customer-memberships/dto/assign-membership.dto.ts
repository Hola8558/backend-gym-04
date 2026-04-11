import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AssignMembershipDto {
  @Type(() => Number)
  @IsInt()
  id_user: number;

  @Type(() => Number)
  @IsInt()
  id_membership_type: number;
}
