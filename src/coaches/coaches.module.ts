import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { EntryLogsModule } from '../entry-logs/entry-logs.module';
import { UsersModule } from '../users/users.module';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';

@Module({
  imports: [UsersModule, EntryLogsModule],
  controllers: [CoachesController],
  providers: [CoachesService, RolesGuard],
})
export class CoachesModule {}
