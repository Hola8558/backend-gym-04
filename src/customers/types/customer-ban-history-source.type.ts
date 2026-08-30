import type { BanStatus } from '@prisma/client';

export type CustomerBanHistoryRow = {
  idBan: number;
  createdAt: Date;
  reason: string;
  status: BanStatus;
  liftedAt: Date | null;
  liftReason: string | null;
  coach: {
    profile: {
      name: string | null;
      lastName: string | null;
    } | null;
  };
  liftedBy: {
    profile: {
      name: string | null;
      lastName: string | null;
    } | null;
  } | null;
};
