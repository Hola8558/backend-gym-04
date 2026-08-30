import type { Prisma } from '@prisma/client';

export type RoutineRowForMobile = {
  idRoutine: number;
  editedAt: Date;
  data: Prisma.JsonValue;
};
