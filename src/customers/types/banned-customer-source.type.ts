/** Row shape from Prisma CustomerBan select for banned-customers listing. */
export type BannedBanRowSource = {
  idBan: number;
  createdAt: Date;
  reason: string;
  status: string;
  customer: {
    idUser: number;
    userNumber: string | null;
    email: string | null;
    profile: {
      name: string | null;
      lastName: string | null;
      phone?: string | null;
    } | null;
    customerMembership: {
      idMembershipType: number;
    } | null;
  };
  coach: {
    profile: {
      name: string | null;
      lastName: string | null;
    } | null;
  };
};
