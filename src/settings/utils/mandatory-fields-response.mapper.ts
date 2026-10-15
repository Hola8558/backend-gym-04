import { plainToInstance } from 'class-transformer';
import { MandatoryFieldsResponseDto } from '../dto/mandatory-fields-response.dto';

export function toMandatoryFieldsResponseDto(
  mandatoryFields: string[],
): MandatoryFieldsResponseDto {
  return plainToInstance(
    MandatoryFieldsResponseDto,
    { mandatory_fields: mandatoryFields },
    { excludeExtraneousValues: true },
  );
}
