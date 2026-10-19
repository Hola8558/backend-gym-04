import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { CrowdmeterController } from './crowdmeter.controller';
import { CrowdmeterService } from './crowdmeter.service';

@Module({
  imports: [TasksModule],
  controllers: [CrowdmeterController],
  providers: [CrowdmeterService],
})
export class CrowdmeterModule {}
