ALTER TABLE "account_details" ADD COLUMN IF NOT EXISTS "global_measurements" JSONB;

ALTER TABLE "account_details" ADD COLUMN IF NOT EXISTS "unit_system" VARCHAR(16);

UPDATE "account_details"
SET "unit_system" = 'metric'
WHERE "unit_system" IS NULL;

ALTER TABLE "account_details"
  ALTER COLUMN "unit_system" SET DEFAULT 'metric';
