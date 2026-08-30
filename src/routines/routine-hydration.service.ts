import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import type { HydratedExercisePayload } from './types/hydrated-exercise-payload.type';

const WEEK_DAY_KEYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] as const;

@Injectable()
export class RoutineHydrationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parses each routine week JSON blob, loads referenced exercises once, and merges
   * catalog fields (name, url_image, muscular_group, etc.) flat onto each routine item.
   */
  async hydrateRoutineData(rawRoutineData: unknown[]): Promise<unknown[]> {
    if (!Array.isArray(rawRoutineData)) {
      return [];
    }

    const clonedWeeks = this.deepCloneJson(rawRoutineData) as unknown[];
    const uniqueIds = this.collectUniqueExerciseIds(clonedWeeks);

    if (uniqueIds.length === 0) {
      return clonedWeeks;
    }

    const exercises = await this.prisma.exercise.findMany({
      where: { idExercise: { in: uniqueIds } },
      select: {
        idExercise: true,
        name: true,
        description: true,
        url: true,
        muscularGroup: true,
      },
    });

    const byId: Record<number, HydratedExercisePayload> = {};
    for (const row of exercises) {
      byId[row.idExercise] = {
        id: row.idExercise,
        name: row.name ?? null,
        description: row.description ?? null,
        url_image: row.url ?? null,
        muscular_group: row.muscularGroup ?? null,
      };
    }

    return clonedWeeks.map((weekRoot) => this.hydrateWeekRoot(weekRoot, byId));
  }

  private hydrateWeekRoot(
    weekRoot: unknown,
    byId: Record<number, HydratedExercisePayload>,
  ): unknown {
    if (typeof weekRoot !== 'object' || weekRoot === null || Array.isArray(weekRoot)) {
      return weekRoot;
    }

    const out = { ...(weekRoot as Record<string, unknown>) };

    for (const dayKey of WEEK_DAY_KEYS) {
      const dayBlocks = out[dayKey];
      if (!Array.isArray(dayBlocks)) {
        continue;
      }

      out[dayKey] = dayBlocks.map((item) => this.hydrateRoutineItem(item, byId));
    }

    return out;
  }

  private hydrateRoutineItem(
    item: unknown,
    byId: Record<number, HydratedExercisePayload>,
  ): unknown {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return item;
    }

    const row = item as Record<string, unknown>;
    const next = { ...row };

    const exId = next.exercise_id;
    if (typeof exId === 'number' && Number.isFinite(exId) && Number.isInteger(exId)) {
      const exerciseData = byId[exId];
      if (exerciseData) {
        Object.assign(next, exerciseData);
        delete next.exercise;
      }
    }

    const circuits = next.exercises;
    if (Array.isArray(circuits)) {
      next.exercises = circuits.map((sub) => this.hydrateRoutineItem(sub, byId));
    }

    return next;
  }

  private collectUniqueExerciseIds(weekRoots: unknown[]): number[] {
    const set = new Set<number>();

    for (const root of weekRoots) {
      if (typeof root !== 'object' || root === null || Array.isArray(root)) {
        continue;
      }

      const obj = root as Record<string, unknown>;

      for (const dayKey of WEEK_DAY_KEYS) {
        const dayBlocks = obj[dayKey];
        if (!Array.isArray(dayBlocks)) continue;

        for (const item of dayBlocks) {
          this.collectIdsFromRoutineItem(item, set);
        }
      }
    }

    return [...set];
  }

  private collectIdsFromRoutineItem(item: unknown, into: Set<number>): void {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return;
    }

    const row = item as Record<string, unknown>;
    const exId = row.exercise_id;

    if (typeof exId === 'number' && Number.isFinite(exId) && Number.isInteger(exId)) {
      into.add(exId);
    }

    const circuits = row.exercises;
    if (Array.isArray(circuits)) {
      for (const nested of circuits) {
        this.collectIdsFromRoutineItem(nested, into);
      }
    }
  }

  private deepCloneJson<T>(value: T): T {
    return structuredClone(value);
  }
}
