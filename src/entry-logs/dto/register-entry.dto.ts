import { IsString, MinLength } from 'class-validator';

export class RegisterEntryDto {
  @IsString()
  @MinLength(1)
  user_number: string;
}
