import type { MuscularGroup } from '@prisma/client';

/** Catalog fields shared by `GET /exercises` and the mobile routine payload. */
export type ExerciseCatalogFields = {
  id_exercise: number;
  name: string | null;
  name_es: string | null;
  description: string | null;
  description_es: string | null;
  aliases: string[];
  /** Facets: canonical lowercase snake_case, null when empty. */
  category: string | null;
  equipment: string | null;
  force: string | null;
  mechanic: string | null;
  level: string | null;
  muscular_group: MuscularGroup;
  /** Exercise media folder ending in `/`; clients append `0.jpg` / `1.jpg`. */
  url: string | null;
};
