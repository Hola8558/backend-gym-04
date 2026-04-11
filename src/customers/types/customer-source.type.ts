import { GenericStatus } from '@prisma/client';

export interface CustomerSource {
  idUser: number;
  email: string | null;
  status: GenericStatus;
  editAt: Date;
  profile: {
    name: string | null;
    lastName: string | null;
    phone: string | null;
    emergencyPhone: string | null;
    createdAt: Date | null;
  } | null;
}
