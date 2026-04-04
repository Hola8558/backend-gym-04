import { Injectable, NotFoundException } from '@nestjs/common';
import { Exercise } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../core/prisma/prisma.service';
import { ExerciseResponseDto } from './dto/exercise-response.dto';
import { FavoriteExerciseResponseDto } from './dto/favorite-exercise-response.dto';

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
}
