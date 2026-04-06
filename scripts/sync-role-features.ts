import { GenericStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting role-based feature sync...');

  const masterFeatures = await prisma.feature.findMany({
    where: {
      status: GenericStatus.active,
    },
    select: {
      idFeature: true,
      name: true,
      role: true,
      customizable: true,
    },
  });

  const featuresByRole = new Map(
    Object.entries(
      masterFeatures.reduce<Record<string, typeof masterFeatures>>(
        (acc, feature) => {
          const key = feature.role;
          acc[key] ??= [];
          acc[key].push(feature);
          return acc;
        },
        {},
      ),
    ),
  );

  const users = await prisma.user.findMany({
    where: { status: GenericStatus.active },
    select: {
      idUser: true,
      idAccount: true,
      role: true,
    },
    orderBy: { idUser: 'asc' },
  });

  let processedUsers = 0;
  let createdOrVerifiedFlags = 0;

  for (const user of users) {
    processedUsers += 1;
    const allowedFeatures = featuresByRole.get(user.role) ?? [];

    console.log(
      `Syncing user ${user.idUser} (account ${user.idAccount}, role ${user.role})...`,
    );

    for (const feature of allowedFeatures) {
      try {
        await prisma.featureFlag.upsert({
          where: {
            idUser_idFeature: {
              idUser: user.idUser,
              idFeature: feature.idFeature,
            },
          },
          update: {},
          create: {
            idUser: user.idUser,
            idFeature: feature.idFeature,
            status: feature.customizable
              ? GenericStatus.inactive
              : GenericStatus.active,
          },
        });

        createdOrVerifiedFlags += 1;
        console.log(
          `  OK -> ${feature.name ?? `feature#${feature.idFeature}`} (${feature.customizable ? 'inactive' : 'active'})`,
        );
      } catch (error) {
        console.error(
          `  ERROR -> user ${user.idUser}, feature ${feature.name ?? `feature#${feature.idFeature}`}:`,
          error,
        );
      }
    }
  }

  console.log(
    `Feature sync complete. Users processed=${processedUsers}, flags processed=${createdOrVerifiedFlags}`,
  );
}

main()
  .catch((error) => {
    console.error('Fatal sync error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
