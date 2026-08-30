import { Module } from '@nestjs/common';
import { CrowdmeterController } from './crowdmeter.controller';
import { CrowdmeterService } from './crowdmeter.service';

@Module({
  controllers: [CrowdmeterController],
  providers: [CrowdmeterService],
})
export class CrowdmeterModule {}
