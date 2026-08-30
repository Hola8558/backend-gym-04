import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  controllers: [RecipesController],
  providers: [RecipesService, RolesGuard],
  exports: [RecipesService],
})
export class RecipesModule {}
