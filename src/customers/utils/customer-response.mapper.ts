import { plainToInstance } from 'class-transformer';
import { CustomerResponseDto } from '../dto/customer-response.dto';
import { CustomerSource } from '../types/customer-source.type';

export function toCustomerResponseDto(
  row: CustomerSource,
): CustomerResponseDto {
  return plainToInstance(
    CustomerResponseDto,
    {
      id: row.idUser,
      name: row.profile?.name ?? '',
      lastname: row.profile?.lastName ?? '',
      email: row.email,
      phone: row.profile?.phone ?? null,
      emergency_phone: row.profile?.emergencyPhone ?? null,
      status: row.status,
      created_at: row.profile?.createdAt ?? row.editAt,
    },
    { excludeExtraneousValues: true },
  );
}
