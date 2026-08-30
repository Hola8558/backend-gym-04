import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
  controllers: [ResourcesController],
  providers: [ResourcesService, RolesGuard],
  exports: [ResourcesService],
})
export class ResourcesModule {}
