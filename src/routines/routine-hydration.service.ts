import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import type { ExerciseCatalogFields } from '../exercises/types/exercise-catalog-fields.type';
import { buildExerciseCatalogFields } from '../exercises/utils/build-exercise-catalog-fields.util';
import type { MobileRoutineWeekData } from './types/mobile-routine-week-data.type';
import { collectRoutineExerciseIds } from './utils/collect-routine-exercise-ids.util';
import { mapMobileRoutineWeek } from './utils/map-mobile-routine-week.util';

@Injectable()
export class RoutineHydrationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Stored week JSON blobs -> mobile weeks: catalog fields (both languages, aliases,
   * snake_case facets, media folder url) merged into each exercise, one query for all ids.
   */
  async hydrateRoutineData(rawWeeks: unknown[]): Promise<MobileRoutineWeekData[]> {
    if (!Array.isArray(rawWeeks)) {
      return [];
    }

    const ids = collectRoutineExerciseIds(rawWeeks);
    const exercises =
      ids.length === 0
        ? []
        : await this.prisma.exercise.findMany({ where: { idExercise: { in: ids } } });

    const catalogById = new Map<number, ExerciseCatalogFields>(
      exercises.map((exercise) => [exercise.idExercise, buildExerciseCatalogFields(exercise)]),
    );

    return rawWeeks.map((rawWeek) => mapMobileRoutineWeek(rawWeek, catalogById));
  }
}
