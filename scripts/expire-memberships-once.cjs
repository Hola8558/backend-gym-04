/**
 * One-shot run of the same Prisma update as MembershipCronService.expireStaleMemberships().
 * Usage: from backend-gym, `node scripts/expire-memberships-once.cjs`
 */
const { PrismaClient, GenericStatus } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const now = new Date();
    const result = await prisma.customerMembership.updateMany({
      where: {
        status: GenericStatus.active,
        endDate: { lt: now },
      },
      data: { status: GenericStatus.inactive },
    });
    console.log(`CRON: Successfully expired ${result.count} memberships`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
