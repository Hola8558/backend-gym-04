import { GenericStatus } from '@prisma/client';

export interface CustomerSource {
  idUser: number;
  userNumber: string | null;
  email: string | null;
  birthdate: Date | null;
  status: GenericStatus;
  editAt: Date;
  profile: {
    name: string | null;
    lastName: string | null;
    phone: string | null;
    emergencyPhone: string | null;
    observations: string | null;
    createdAt: Date | null;
    enrollmentDate?: Date | null;
    coach: {
      profile: {
        name: string | null;
        lastName: string | null;
      } | null;
    } | null;
  } | null;
  customerMemberships: Array<{
    idMembershipType: number;
    status: GenericStatus;
    startDate: Date;
    endDate: Date | null;
    createdAt: Date;
    membershipType: {
      name: string;
    };
  }>;
  activeRoutinesCount?: number;
}
