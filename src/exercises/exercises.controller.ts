import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { AddFavoriteExerciseDto } from './dto/add-favorite-exercise.dto';
import { ExerciseResponseDto } from './dto/exercise-response.dto';
import { FavoriteExerciseResponseDto } from './dto/favorite-exercise-response.dto';
import { ExercisesService } from './exercises.service';

@ApiTags('exercises')
@ApiBearerAuth()
@Controller('exercises')
@UseGuards(RolesGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @Roles(UserRole.coach, UserRole.owner)
  @ApiOperation({ summary: 'List the global exercise catalog' })
  @ApiResponse({ status: 200, type: ExerciseResponseDto, isArray: true })
  findAll(@CurrentUser() _user: JwtPayload) {
    return this.exercisesService.findAll();
  }

  @Post('favorites')
  @Roles(UserRole.coach, UserRole.owner)
  @ApiOperation({ summary: 'Favorite a global exercise for the current account' })
  @ApiResponse({ status: 201, type: FavoriteExerciseResponseDto })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  addFavorite(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddFavoriteExerciseDto,
  ) {
    return this.exercisesService.addFavorite(user.id_account, dto.id_exercise);
  }

  @Get('favorites')
  @Roles(UserRole.coach, UserRole.owner)
  @ApiOperation({ summary: 'List favorite exercises for the current account' })
  @ApiResponse({ status: 200, type: ExerciseResponseDto, isArray: true })
  findFavorites(@CurrentUser() user: JwtPayload) {
    return this.exercisesService.findFavorites(user.id_account);
  }

  @Delete('favorites/:id_exercise')
  @Roles(UserRole.coach, UserRole.owner)
  @ApiOperation({ summary: 'Remove a favorite exercise for the current account' })
  @ApiResponse({ status: 200, type: FavoriteExerciseResponseDto })
  removeFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('id_exercise', ParseIntPipe) idExercise: number,
  ) {
    return this.exercisesService.removeFavorite(user.id_account, idExercise);
  }

  @Get(':id_exercise')
  @Roles(UserRole.owner, UserRole.coach, UserRole.customer)
  @ApiOperation({ summary: 'Get one exercise from the global catalog' })
  @ApiResponse({ status: 200, type: ExerciseResponseDto })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  findOne(
    @CurrentUser() _user: JwtPayload,
    @Param('id_exercise', ParseIntPipe) idExercise: number,
  ) {
    return this.exercisesService.findOne(idExercise);
  }
}
