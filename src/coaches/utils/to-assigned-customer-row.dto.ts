import { plainToInstance } from 'class-transformer';
import { AssignedCustomerRowDto } from '../dto/assigned-customer-row.dto';

type Row = {
  idUser: number;
  email: string | null;
  profile: { name: string | null; lastName: string | null } | null;
};

export function toAssignedCustomerRowDto(row: Row): AssignedCustomerRowDto {
  return plainToInstance(
    AssignedCustomerRowDto,
    {
      id_user: row.idUser,
      name: row.profile?.name ?? null,
      lastname: row.profile?.lastName ?? null,
      email: row.email,
    },
    { excludeExtraneousValues: true },
  );
}
