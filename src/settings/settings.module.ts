import { Module } from '@nestjs/common';
import { PrismaModule } from '../core/prisma/prisma.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { QuickAccessService } from './quick-access.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [SettingsService, QuickAccessService, RolesGuard],
})
export class SettingsModule {}
