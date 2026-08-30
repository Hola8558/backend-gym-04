import { Module } from '@nestjs/common';
import { PrismaModule } from '../core/prisma/prisma.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [SettingsService, RolesGuard],
})
export class SettingsModule {}
