import { plainToInstance } from 'class-transformer';
import { AssignedCustomerRowDto } from '../dto/assigned-customer-row.dto';

type Row = {
  idUser: number;
  email: string | null;
  userNumber: string | null;
  profile: {
    name: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  customerMemberships: Array<{
    membershipType: { name: string } | null;
  }>;
};

export function toAssignedCustomerRowDto(row: Row): AssignedCustomerRowDto {
  return plainToInstance(
    AssignedCustomerRowDto,
    {
      id_user: row.idUser,
      name: row.profile?.name ?? null,
      lastname: row.profile?.lastName ?? null,
      email: row.email,
      user_number: row.userNumber,
      phone: row.profile?.phone ?? null,
      membership_name: row.customerMemberships[0]?.membershipType?.name ?? null,
    },
    { excludeExtraneousValues: true },
  );
}
