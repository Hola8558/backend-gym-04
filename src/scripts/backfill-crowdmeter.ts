import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EntryLogsCronService } from '../tasks/entry-logs-cron.service';
import { getCrowdmeterDayForDate } from '../tasks/utils/crowdmeter-day.util';

const DAYS_IN_WEEK = 7;
const SUNDAY_UTC_REFERENCE = Date.UTC(2024, 0, 7);

function parseAccountId(raw: string | undefined): number {
  if (raw == null) {
    console.error('Missing required id_account argument.');
    console.error('Usage: npm run backfill:crowdmeter -- 123');
    process.exit(1);
  }

  const accountId = Number(raw);
  if (!Number.isInteger(accountId) || accountId <= 0) {
    console.error(`Invalid id_account argument: ${raw}`);
    console.error('Usage: npm run backfill:crowdmeter -- 123');
    process.exit(1);
  }

  return accountId;
}

async function bootstrap(): Promise<void> {
  const accountId = parseAccountId(process.argv[2]);
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const crowdmeterService = app.get(EntryLogsCronService);

    for (let dayOffset = 0; dayOffset < DAYS_IN_WEEK; dayOffset += 1) {
      const targetDate = new Date(
        SUNDAY_UTC_REFERENCE + dayOffset * 24 * 60 * 60 * 1000,
      );
      await crowdmeterService.generateCrowdmeterForAccount(
        accountId,
        targetDate,
      );
      console.log(
        `Crowdmeter backfill completed for account ${accountId} (${getCrowdmeterDayForDate(targetDate)})`,
      );
    }
  } finally {
    await app.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Crowdmeter backfill failed.');
    console.error(error);
    process.exit(1);
  });
