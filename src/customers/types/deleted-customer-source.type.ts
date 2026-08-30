import { GenericStatus } from '@prisma/client';

export interface DeletedCustomerSource {
  idUser: number;
  userNumber: string | null;
  email: string | null;
  status: GenericStatus;
  editAt: Date;
  deletedBy: {
    profile: {
      name: string | null;
      lastName: string | null;
    } | null;
  } | null;
  profile: {
    name: string | null;
    lastName: string | null;
    phone: string | null;
    emergencyPhone: string | null;
    observations: string | null;
    createdAt: Date | null;
    coach: {
      profile: {
        name: string | null;
        lastName: string | null;
      } | null;
    } | null;
  } | null;
  customerMembership: {
    idMembershipType: number;
    status: GenericStatus;
    membershipType: {
      name: string;
    };
  } | null;
}
