import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, switchMap } from 'rxjs';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PrismaService } from '../core/prisma/prisma.service';
import { DailyTasksService } from './daily-tasks.service';
import {
  isBeforeTodayLocal,
  msUntilNextLocalMidnight,
} from './utils/is-before-today-local.util';

@Injectable()
export class DailyInitializationInterceptor implements NestInterceptor {
  private initializedAccountsToday = new Set<number>();
  private midnightClearTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly dailyTasks: DailyTasksService,
    private readonly prisma: PrismaService,
  ) {
    this.scheduleMidnightCacheClear();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const accountId = request.user?.id_account;

    if (accountId == null) {
      return next.handle();
    }

    if (this.initializedAccountsToday.has(accountId)) {
      return next.handle();
    }

    return from(this.ensureDailyInitialization(accountId)).pipe(
      switchMap(() => next.handle()),
    );
  }

  private async ensureDailyInitialization(accountId: number): Promise<void> {
    if (this.initializedAccountsToday.has(accountId)) {
      return;
    }

    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount: accountId },
      select: { lastDailyInit: true },
    });

    if (!detail) {
      this.initializedAccountsToday.add(accountId);
      return;
    }

    if (isBeforeTodayLocal(detail.lastDailyInit)) {
      await this.dailyTasks.runDailyTasksForAccount(accountId);
    }

    this.initializedAccountsToday.add(accountId);
  }

  private scheduleMidnightCacheClear(): void {
    if (this.midnightClearTimer != null) {
      return;
    }

    this.midnightClearTimer = setTimeout(() => {
      this.initializedAccountsToday.clear();
      this.midnightClearTimer = null;
      this.scheduleMidnightCacheClear();
    }, msUntilNextLocalMidnight());
  }
}
