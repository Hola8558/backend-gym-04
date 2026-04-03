import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';

@Module({
  controllers: [ExercisesController],
  providers: [ExercisesService, RolesGuard],
})
export class ExercisesModule {}
