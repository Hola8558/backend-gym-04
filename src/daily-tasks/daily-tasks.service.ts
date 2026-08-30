import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { generateKioskAccessCode } from '../entry-logs/utils/generate-kiosk-access-code.util';
import { EntryLogsCronService } from '../tasks/entry-logs-cron.service';

@Injectable()
export class DailyTasksService {
  private readonly logger = new Logger(DailyTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cronService: EntryLogsCronService,
  ) {}

  async runDailyTasksForAccount(accountId: number): Promise<void> {
    const accessCode = generateKioskAccessCode();

    await this.prisma.accountDetail.update({
      where: { idAccount: accountId },
      data: {
        accessCode,
        lastDailyInit: new Date(),
      },
    });
    await this.cronService.generateCrowdmeterForAccount(accountId, new Date());

    this.logger.log(
      `Daily init completed for account ${accountId} (kiosk access code rotated)`,
    );
  }
}
