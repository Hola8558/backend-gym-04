/** Flat exercise fields merged onto routine items during mobile/API hydration. */
export type HydratedExercisePayload = {
  id: number;
  name: string | null;
  name_es: string | null;
  description: string | null;
  description_es: string | null;
  url_image: string | null;
  muscular_group?: string | null;
};