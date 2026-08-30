import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { DailyInitializationInterceptor } from './daily-initialization.interceptor';
import { DailyTasksService } from './daily-tasks.service';

@Module({
  imports: [TasksModule],
  providers: [DailyTasksService, DailyInitializationInterceptor],
  exports: [DailyTasksService, DailyInitializationInterceptor],
})
export class DailyTasksModule {}
