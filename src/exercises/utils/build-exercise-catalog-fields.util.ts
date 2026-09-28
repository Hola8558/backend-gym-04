import type { Exercise } from '@prisma/client';
import type { ExerciseCatalogFields } from '../types/exercise-catalog-fields.type';
import { normalizeCatalogFolderUrl } from './normalize-catalog-folder-url.util';
import { normalizeExerciseFacetValue } from './normalize-exercise-facet-value.util';

export function buildExerciseCatalogFields(exercise: Exercise): ExerciseCatalogFields {
  const folder = normalizeCatalogFolderUrl(exercise.url);
  return {
    id_exercise: exercise.idExercise,
    name: exercise.name,
    name_es: exercise.nameEs,
    description: exercise.description,
    description_es: exercise.descriptionEs,
    aliases: exercise.aliases ?? [],
    category: normalizeExerciseFacetValue(exercise.category),
    equipment: normalizeExerciseFacetValue(exercise.equipment),
    force: normalizeExerciseFacetValue(exercise.force),
    mechanic: normalizeExerciseFacetValue(exercise.mechanic),
    level: normalizeExerciseFacetValue(exercise.level),
    muscular_group: exercise.muscularGroup,
    url: folder ? `${folder}/` : null,
  };
}
