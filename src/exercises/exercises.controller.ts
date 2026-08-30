import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
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
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({ summary: 'List the global exercise catalog' })
  @ApiResponse({ status: 200, type: ExerciseResponseDto, isArray: true })
  findAll(@CurrentUser() _user: JwtPayload) {
    return this.exercisesService.findAll();
  }

  @Get('media-proxy')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary:
      'Proxy a catalog exercise still (…/0.jpg|1.jpg) for PDF capture when CDN CORS blocks the browser',
  })
  @ApiQuery({
    name: 'url',
    required: true,
    description: 'Absolute catalog still URL ending in /0.jpg or /1.jpg',
  })
  @ApiResponse({ status: 200, description: 'Image bytes' })
  @ApiResponse({ status: 400, description: 'Invalid media URL' })
  @ApiResponse({ status: 404, description: 'URL not in exercise catalog' })
  async proxyMedia(@Query('url') url: string): Promise<StreamableFile> {
    const { buffer, contentType } =
      await this.exercisesService.proxyCatalogImage(url);
    return new StreamableFile(buffer, {
      type: contentType,
      disposition: 'inline',
    });
  }

  @Get(':id_exercise/stills/:stillIndex')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary: 'Fetch catalog exercise still 0 or 1 by exercise id (PDF-safe)',
  })
  @ApiResponse({ status: 200, description: 'Image bytes' })
  @ApiResponse({ status: 400, description: 'Invalid still index' })
  @ApiResponse({ status: 404, description: 'Exercise or media not found' })
  async getStill(
    @Param('id_exercise', ParseIntPipe) idExercise: number,
    @Param('stillIndex', ParseIntPipe) stillIndex: number,
  ): Promise<StreamableFile> {
    const { buffer, contentType } = await this.exercisesService.getExerciseStill(
      idExercise,
      stillIndex,
    );
    return new StreamableFile(buffer, {
      type: contentType,
      disposition: 'inline',
    });
  }

  @Post('favorites')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
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
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({ summary: 'List favorite exercises for the current account' })
  @ApiResponse({ status: 200, type: ExerciseResponseDto, isArray: true })
  findFavorites(@CurrentUser() user: JwtPayload) {
    return this.exercisesService.findFavorites(user.id_account);
  }

  @Delete('favorites/:id_exercise')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({ summary: 'Remove a favorite exercise for the current account' })
  @ApiResponse({ status: 200, type: FavoriteExerciseResponseDto })
  removeFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('id_exercise', ParseIntPipe) idExercise: number,
  ) {
    return this.exercisesService.removeFavorite(user.id_account, idExercise);
  }

  @Get(':id_exercise')
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach, UserRole.customer)
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
