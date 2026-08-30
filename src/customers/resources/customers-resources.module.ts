import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ResourcesModule } from '../../resources/resources.module';
import { CustomersResourcesController } from './customers-resources.controller';

@Module({
  imports: [ResourcesModule],
  controllers: [CustomersResourcesController],
  providers: [RolesGuard],
})
export class CustomersResourcesModule {}
