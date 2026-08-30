import { GenericStatus, PrismaClient, UserRole } from '@prisma/client';

const FEATURE_ID = 5013;

const prisma = new PrismaClient();

async function main() {
  const description = {
    titleKey: 'TITLE_SOLO_COACH_RESOURCES',
    descKey: 'DESCRIPTION_SOLO_COACH_RESOURCES',
  };

  const existing = await prisma.feature.findUnique({
    where: { idFeature: FEATURE_ID },
  });

  if (existing) {
    await prisma.feature.update({
      where: { idFeature: FEATURE_ID },
      data: {
        name: 'SOLO_COACH_RESOURCES',
        description,
        role: UserRole.solo_coach,
        customizable: true,
        status: GenericStatus.active,
      },
    });
    console.log(`Updated feature ${FEATURE_ID} (SOLO_COACH_RESOURCES).`);
    return;
  }

  await prisma.feature.create({
    data: {
      idFeature: FEATURE_ID,
      name: 'SOLO_COACH_RESOURCES',
      description,
      role: UserRole.solo_coach,
      customizable: true,
      createdAt: new Date(),
      status: GenericStatus.active,
    },
  });

  console.log(`Created feature ${FEATURE_ID} (SOLO_COACH_RESOURCES).`);
  console.log('Run: npx ts-node scripts/sync-role-features.ts');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
