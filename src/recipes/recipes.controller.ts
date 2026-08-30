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
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { CreateRecipeResponseDto } from './dto/create-recipe-response.dto';
import { DeleteRecipeResponseDto } from './dto/delete-recipe-response.dto';
import { RecipeResponseDto } from './dto/recipe-response.dto';
import { RecipesService } from './recipes.service';

@ApiTags('recipes')
@ApiBearerAuth()
@Controller('recipes')
@UseGuards(RolesGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary:
      'List recipes for the current account plus global recipes (id_account null)',
  })
  @ApiResponse({ status: 200, type: RecipeResponseDto, isArray: true })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.recipesService.findForAccount(user.id_account);
  }

  @Post()
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary:
      'Create a recipe and return a presigned R2 upload URL for recipes/recipe_{id}.webp',
  })
  @ApiResponse({ status: 201, type: CreateRecipeResponseDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRecipeDto,
  ) {
    return this.recipesService.createForAccount(user.id_account, dto);
  }

  @Patch(':id_recipie')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary:
      'Update a tenant recipe and return a presigned R2 upload URL for optional image replace',
  })
  @ApiResponse({ status: 200, type: CreateRecipeResponseDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id_recipie', ParseIntPipe) idRecipie: number,
    @Body() dto: CreateRecipeDto,
  ) {
    return this.recipesService.updateForAccount(
      user.id_account,
      idRecipie,
      dto,
    );
  }

  @Delete(':id_recipie')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary:
      'Delete a tenant recipe (rollback after failed Cloudflare image upload)',
  })
  @ApiResponse({ status: 200, type: DeleteRecipeResponseDto })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id_recipie', ParseIntPipe) idRecipie: number,
  ) {
    return this.recipesService.deleteForAccount(user.id_account, idRecipie);
  }
}
