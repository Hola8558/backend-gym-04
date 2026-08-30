-- Align resources_categories / resources_media with Prisma schema and migrate legacy categories/media data.

-- Fix typo on resources_media primary key column (tables are empty).
ALTER TABLE "resources_media" RENAME COLUMN "id_resoruces_media" TO "id_resources_media";

-- Add columns required by the application (soft-delete + category relation).
ALTER TABLE "resources_categories"
  ADD COLUMN IF NOT EXISTS "status" "generic_status" NOT NULL DEFAULT 'active';

ALTER TABLE "resources_media"
  ADD COLUMN IF NOT EXISTS "category_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "status" "generic_status" NOT NULL DEFAULT 'active';

-- Normalize timestamps for @updatedAt semantics.
ALTER TABLE "resources_categories"
  ALTER COLUMN "created_at" SET NOT NULL,
  ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "edited_at" SET NOT NULL,
  ALTER COLUMN "edited_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "resources_media"
  ALTER COLUMN "created_at" SET NOT NULL,
  ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "edited_at" SET NOT NULL,
  ALTER COLUMN "edited_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Copy any rows saved to the legacy tables before the @@map fix.
INSERT INTO "resources_categories" (
  "id_resources_categories",
  "id_account",
  "name",
  "description",
  "created_at",
  "edited_at",
  "status"
)
SELECT
  c."id_resources_categories",
  c."id_account",
  c."name",
  c."description",
  c."created_at",
  c."edited_at",
  c."status"
FROM "categories" c
WHERE c."status" <> 'deleted'
ON CONFLICT ("id_resources_categories") DO NOTHING;

INSERT INTO "resources_media" (
  "id_resources_media",
  "category_id",
  "title",
  "description",
  "link",
  "created_at",
  "edited_at",
  "status"
)
SELECT
  m."id_resources_media",
  m."category_id",
  m."title",
  m."description",
  m."link",
  m."created_at",
  m."edited_at",
  m."status"
FROM "media" m
WHERE m."status" <> 'deleted'
ON CONFLICT ("id_resources_media") DO NOTHING;

-- category_id is required once media rows exist.
ALTER TABLE "resources_media"
  ALTER COLUMN "category_id" SET NOT NULL;

-- Foreign keys and indexes.
CREATE INDEX IF NOT EXISTS "resources_categories_id_account_idx"
  ON "resources_categories" ("id_account");

CREATE INDEX IF NOT EXISTS "resources_media_category_id_idx"
  ON "resources_media" ("category_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'resources_categories_id_account_fkey'
  ) THEN
    ALTER TABLE "resources_categories"
      ADD CONSTRAINT "resources_categories_id_account_fkey"
      FOREIGN KEY ("id_account") REFERENCES "accounts" ("id_account")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'resources_media_category_id_fkey'
  ) THEN
    ALTER TABLE "resources_media"
      ADD CONSTRAINT "resources_media_category_id_fkey"
      FOREIGN KEY ("category_id") REFERENCES "resources_categories" ("id_resources_categories")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Legacy tables are superseded by resources_* .
DROP TABLE IF EXISTS "media";
DROP TABLE IF EXISTS "categories";
