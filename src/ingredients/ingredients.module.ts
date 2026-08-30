import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { IngredientsController } from './ingredients.controller';
import { IngredientsService } from './ingredients.service';

@Module({
  controllers: [IngredientsController],
  providers: [IngredientsService, RolesGuard],
  exports: [IngredientsService],
})
export class IngredientsModule {}
