import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { DeleteIngredientResponseDto } from './dto/delete-ingredient-response.dto';
import { IngredientResponseDto } from './dto/ingredient-response.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { IngredientsService } from './ingredients.service';

@ApiTags('ingredients')
@ApiBearerAuth()
@Controller('ingredients')
@UseGuards(RolesGuard)
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get()
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary:
      'List ingredients visible for the current account (global + account custom, minus replacements)',
  })
  @ApiResponse({ status: 200, type: IngredientResponseDto, isArray: true })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.ingredientsService.findVisibleForAccount(user.id_account);
  }

  @Post()
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary:
      'Create an account-owned ingredient (ingredients + original_new with id_original null)',
  })
  @ApiResponse({ status: 201, type: IngredientResponseDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateIngredientDto,
  ) {
    return this.ingredientsService.createForAccount(user.id_account, dto);
  }

  @Patch(':id_ingredient')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary:
      'Edit an ingredient for the current account (clone global + map, or update owned custom)',
  })
  @ApiResponse({ status: 200, type: IngredientResponseDto })
  @ApiResponse({ status: 404, description: 'Ingredient not found' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id_ingredient', ParseIntPipe) idIngredient: number,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.ingredientsService.updateForAccount(
      user.id_account,
      idIngredient,
      dto,
    );
  }

  @Delete(':id_ingredient')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary:
      'Delete an account-owned ingredient (original_new_ingredients + ingredients row)',
  })
  @ApiResponse({ status: 200, type: DeleteIngredientResponseDto })
  @ApiResponse({ status: 403, description: 'Global ingredients cannot be deleted' })
  @ApiResponse({ status: 404, description: 'Ingredient not found' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id_ingredient', ParseIntPipe) idIngredient: number,
  ) {
    return this.ingredientsService.deleteForAccount(
      user.id_account,
      idIngredient,
    );
  }
}
