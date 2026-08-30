import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Exercise } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../core/prisma/prisma.service';
import { ExerciseResponseDto } from './dto/exercise-response.dto';
import { FavoriteExerciseResponseDto } from './dto/favorite-exercise-response.dto';
import type { CatalogMediaProxyResult } from './types/catalog-media-proxy-result.type';
import { buildExerciseStillAbsoluteUrl } from './utils/build-exercise-still-absolute-url.util';
import { catalogMediaFolderCandidates } from './utils/catalog-media-folder-candidates.util';
import { fetchUpstreamExerciseStill } from './utils/fetch-upstream-exercise-still.util';
import { isCatalogExerciseStillUrl } from './utils/is-catalog-exercise-still-url.util';
import { normalizeCatalogFolderUrl } from './utils/normalize-catalog-folder-url.util';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  private toExerciseResponse(exercise: Exercise): ExerciseResponseDto {
    return plainToInstance(
      ExerciseResponseDto,
      {
        id_exercise: exercise.idExercise,
        name: exercise.name,
        muscular_group: exercise.muscularGroup,
        description: exercise.description,
        url: exercise.url,
      },
      { excludeExtraneousValues: true },
    );
  }

  async addFavorite(
    idAccount: number,
    idExercise: number,
  ): Promise<FavoriteExerciseResponseDto> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { idExercise },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    try {
      await this.prisma.exerciseFav.create({
        data: {
          idAccount,
          idExercise,
        },
      });
    } catch (e) {
      if (
        !(e instanceof PrismaClientKnownRequestError && e.code === 'P2002')
      ) {
        throw e;
      }
    }

    return plainToInstance(
      FavoriteExerciseResponseDto,
      {
        id_exercise: idExercise,
        favorited: true,
      },
      { excludeExtraneousValues: true },
    );
  }

  async removeFavorite(
    idAccount: number,
    idExercise: number,
  ): Promise<FavoriteExerciseResponseDto> {
    try {
      await this.prisma.exerciseFav.delete({
        where: {
          idAccount_idExercise: {
            idAccount,
            idExercise,
          },
        },
      });
    } catch (e) {
      if (!(e instanceof PrismaClientKnownRequestError && e.code === 'P2025')) {
        throw e;
      }
    }

    return plainToInstance(
      FavoriteExerciseResponseDto,
      {
        id_exercise: idExercise,
        favorited: false,
      },
      { excludeExtraneousValues: true },
    );
  }

  async findFavorites(idAccount: number): Promise<ExerciseResponseDto[]> {
    const rows = await this.prisma.exerciseFav.findMany({
      where: { idAccount },
      include: { exercise: true },
      orderBy: { idExercise: 'asc' },
    });

    return rows.map((row) => this.toExerciseResponse(row.exercise));
  }

  async findAll(): Promise<ExerciseResponseDto[]> {
    const rows = await this.prisma.exercise.findMany({
      orderBy: { idExercise: 'asc' },
    });

    return rows.map((row) => this.toExerciseResponse(row));
  }

  async findOne(idExercise: number): Promise<ExerciseResponseDto> {
    const row = await this.prisma.exercise.findUnique({
      where: { idExercise },
    });

    if (!row) {
      throw new NotFoundException('Exercise not found');
    }

    return this.toExerciseResponse(row);
  }

  /**
   * Fetches still `0` or `1` for a catalog exercise by id (preferred PDF path).
   */
  async getExerciseStill(
    idExercise: number,
    stillIndex: number,
  ): Promise<CatalogMediaProxyResult> {
    if (stillIndex !== 0 && stillIndex !== 1) {
      throw new BadRequestException('EXERCISES.ERRORS.INVALID_MEDIA_URL');
    }

    const exercise = await this.prisma.exercise.findUnique({
      where: { idExercise },
      select: { url: true },
    });

    const folder = normalizeCatalogFolderUrl(exercise?.url);
    if (!folder) {
      throw new NotFoundException('EXERCISES.ERRORS.MEDIA_NOT_IN_CATALOG');
    }

    const absoluteUrl = buildExerciseStillAbsoluteUrl(
      folder,
      stillIndex as 0 | 1,
    );

    try {
      return await fetchUpstreamExerciseStill(absoluteUrl);
    } catch {
      throw new BadGatewayException('EXERCISES.ERRORS.MEDIA_FETCH_FAILED');
    }
  }

  /**
   * Fetches a catalog still (`…/0.jpg` | `…/1.jpg`) after verifying it belongs
   * to an exercise folder prefix stored in the DB (no hardcoded hosts).
   */
  async proxyCatalogImage(url: string): Promise<CatalogMediaProxyResult> {
    const trimmed = url?.trim() ?? '';
    if (!isCatalogExerciseStillUrl(trimmed)) {
      throw new BadRequestException('EXERCISES.ERRORS.INVALID_MEDIA_URL');
    }

    const candidates = catalogMediaFolderCandidates(trimmed);
    const folderFromImage = normalizeCatalogFolderUrl(trimmed);

    const exact = await this.prisma.exercise.findFirst({
      where: { url: { in: candidates } },
      select: { idExercise: true },
    });

    let matchedId = exact?.idExercise ?? null;

    if (matchedId == null && folderFromImage) {
      const rows = await this.prisma.exercise.findMany({
        where: { url: { not: null } },
        select: { idExercise: true, url: true },
      });
      matchedId =
        rows.find(
          (row) => normalizeCatalogFolderUrl(row.url) === folderFromImage,
        )?.idExercise ?? null;
    }

    if (matchedId == null) {
      throw new NotFoundException('EXERCISES.ERRORS.MEDIA_NOT_IN_CATALOG');
    }

    try {
      return await fetchUpstreamExerciseStill(trimmed);
    } catch {
      throw new BadGatewayException('EXERCISES.ERRORS.MEDIA_FETCH_FAILED');
    }
  }
}
