import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsString } from 'class-validator';
import { CUSTOMER_FORM_FIELD_IDS } from '../../common/constants/customer-form-field-ids.const';

export class UpdateMandatoryFieldsDto {
  @ApiProperty({
    type: [String],
    example: ['name', 'lastname', 'email', 'phone', 'emergency_phone'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsIn([...CUSTOMER_FORM_FIELD_IDS], { each: true })
  mandatory_fields!: string[];
}
