import { Module } from '@nestjs/common';
import { RoutineHydrationService } from './routine-hydration.service';
import { RoutinesController } from './routines.controller';
import { RoutinesService } from './routines.service';

@Module({
  controllers: [RoutinesController],
  providers: [RoutinesService, RoutineHydrationService],
  exports: [RoutineHydrationService, RoutinesService],
})
export class RoutinesModule {}
