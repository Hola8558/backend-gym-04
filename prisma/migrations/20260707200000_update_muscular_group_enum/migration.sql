-- AlterEnum: standardize muscular_group to English scalar enum with underscore naming
BEGIN;

CREATE TYPE "muscular_group_new" AS ENUM (
  'abdominals',
  'abductors',
  'adductors',
  'biceps',
  'calves',
  'chest',
  'forearms',
  'glutes',
  'hamstrings',
  'lats',
  'lower_back',
  'middle_back',
  'neck',
  'quadriceps',
  'shoulders',
  'traps',
  'triceps'
);

CREATE OR REPLACE FUNCTION map_muscular_group_label(label text)
RETURNS "muscular_group_new" AS $$
BEGIN
  RETURN (
    CASE label
      WHEN 'pecho' THEN 'chest'
      WHEN 'espalda' THEN 'middle_back'
      WHEN 'hombro_anterior' THEN 'shoulders'
      WHEN 'hombro_lateral' THEN 'shoulders'
      WHEN 'hombro_posterior' THEN 'shoulders'
      WHEN 'biceps' THEN 'biceps'
      WHEN 'triceps' THEN 'triceps'
      WHEN 'antebrazos' THEN 'forearms'
      WHEN 'cuadriceps' THEN 'quadriceps'
      WHEN 'femorales' THEN 'hamstrings'
      WHEN 'gluteos' THEN 'glutes'
      WHEN 'pantorrillas' THEN 'calves'
      WHEN 'core' THEN 'abdominals'
      WHEN 'lower back' THEN 'lower_back'
      WHEN 'middle back' THEN 'middle_back'
      ELSE replace(label, ' ', '_')
    END
  )::"muscular_group_new";
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE "exercises" ADD COLUMN "muscular_group_scalar" "muscular_group_new";

UPDATE "exercises"
SET "muscular_group_scalar" = map_muscular_group_label("muscular_group"::text);

ALTER TABLE "exercises" DROP COLUMN "muscular_group";
ALTER TABLE "exercises" DROP COLUMN IF EXISTS "secondaryMuscles";
ALTER TABLE "exercises" RENAME COLUMN "muscular_group_scalar" TO "muscular_group";
ALTER TABLE "exercises" ALTER COLUMN "muscular_group" SET NOT NULL;

DROP FUNCTION map_muscular_group_label(text);
DROP TYPE "muscular_group";
ALTER TYPE "muscular_group_new" RENAME TO "muscular_group";

COMMIT;
