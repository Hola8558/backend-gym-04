-- Remap gym_db.exercises.muscular_group from enum[] (labels with spaces)
-- to scalar muscular_group enum matching Prisma (underscores).
-- Equivalent intent to migration 20260707200000_update_muscular_group_enum for local DB.

BEGIN;

-- Drop leftover artifacts from a previous partial run.
ALTER TABLE "gym_db"."exercises" DROP COLUMN IF EXISTS "muscular_group_scalar";
DROP FUNCTION IF EXISTS "gym_db".map_muscular_group_label(text);
DROP TYPE IF EXISTS "gym_db"."muscular_group_new";

CREATE TYPE "gym_db"."muscular_group_new" AS ENUM (
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

CREATE OR REPLACE FUNCTION "gym_db".map_muscular_group_label(label text)
RETURNS "gym_db"."muscular_group_new" AS $$
DECLARE
  normalized text;
BEGIN
  -- Array::text yields '{value}' or '{"middle back"}'; take first element.
  normalized := label;
  IF left(normalized, 1) = '{' AND right(normalized, 1) = '}' THEN
    normalized := trim(both '"' from split_part(trim(both '{}' from normalized), ',', 1));
  END IF;

  RETURN (
    CASE normalized
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
      ELSE replace(normalized, ' ', '_')
    END
  )::"gym_db"."muscular_group_new";
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE "gym_db"."exercises"
  ADD COLUMN "muscular_group_scalar" "gym_db"."muscular_group_new";

UPDATE "gym_db"."exercises"
SET "muscular_group_scalar" = "gym_db".map_muscular_group_label("muscular_group"::text);

-- Rows with NULL / unmappable labels: default to chest so SET NOT NULL can succeed.
UPDATE "gym_db"."exercises"
SET "muscular_group_scalar" = 'chest'
WHERE "muscular_group_scalar" IS NULL;

ALTER TABLE "gym_db"."exercises" DROP COLUMN "muscular_group";
ALTER TABLE "gym_db"."exercises" DROP COLUMN IF EXISTS "secondaryMuscles";
ALTER TABLE "gym_db"."exercises" RENAME COLUMN "muscular_group_scalar" TO "muscular_group";
ALTER TABLE "gym_db"."exercises" ALTER COLUMN "muscular_group" SET NOT NULL;

DROP FUNCTION "gym_db".map_muscular_group_label(text);
DROP TYPE "gym_db"."muscular_group";
ALTER TYPE "gym_db"."muscular_group_new" RENAME TO "muscular_group";

COMMIT;
