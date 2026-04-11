-- Backfill nullable membership_types before NOT NULL constraints
UPDATE "membership_types" SET "name" = '' WHERE "name" IS NULL;
UPDATE "membership_types" SET "duration_days" = 1 WHERE "duration_days" IS NULL;
UPDATE "membership_types" SET "price" = 0 WHERE "price" IS NULL;

-- AlterTable
ALTER TABLE "membership_types" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "membership_types" ALTER COLUMN "duration_days" SET NOT NULL;
ALTER TABLE "membership_types" ALTER COLUMN "price" SET NOT NULL;
ALTER TABLE "membership_types" ALTER COLUMN "status" SET DEFAULT 'active';
