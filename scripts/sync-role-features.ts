import { GenericStatus, PrismaClient } from '@prisma/client';
import { ROLE_FEATURE_MAP } from '../src/common/constants/role-features.constant';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting role-based feature sync...');

  const featureNames = [...new Set(Object.values(ROLE_FEATURE_MAP).flat())];
  const masterFeatures = await prisma.feature.findMany({
    where: {
      name: { in: featureNames },
      status: GenericStatus.active,
    },
    select: {
      idFeature: true,
      name: true,
      customizable: true,
    },
  });

  const featureMap = new Map(
    masterFeatures
      .filter(
        (
          feature,
        ): feature is {
          idFeature: number;
          name: string;
          customizable: boolean;
        } => Boolean(feature.name),
      )
      .map((feature) => [feature.name, feature]),
  );

  for (const featureName of featureNames) {
    if (!featureMap.has(featureName)) {
      console.warn(`Missing master feature in DB: ${featureName}`);
    }
  }

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
    const allowedFeatureNames = ROLE_FEATURE_MAP[user.role] ?? [];

    console.log(
      `Syncing user ${user.idUser} (account ${user.idAccount}, role ${user.role})...`,
    );

    for (const featureName of allowedFeatureNames) {
      const feature = featureMap.get(featureName);
      if (!feature) {
        console.warn(
          `Skipping user ${user.idUser}: feature "${featureName}" does not exist`,
        );
        continue;
      }

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
          `  OK -> ${featureName} (${feature.customizable ? 'inactive' : 'active'})`,
        );
      } catch (error) {
        console.error(
          `  ERROR -> user ${user.idUser}, feature ${featureName}:`,
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
