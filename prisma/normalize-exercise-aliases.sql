-- Prisma list fields cannot be optional: `aliases` must be NOT NULL with an empty-array default.
-- Run once per database (local + Neon) before `npx prisma generate`.

BEGIN;

UPDATE gym_db.exercises
SET aliases = '{}'
WHERE aliases IS NULL;

ALTER TABLE gym_db.exercises
  ALTER COLUMN aliases SET DEFAULT '{}',
  ALTER COLUMN aliases SET NOT NULL;

COMMIT;
