-- Prerequisites for Prisma schema push on Neon (gym_db schema)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'gym_db' AND t.typname = 'item_ingrediente'
  ) THEN
    CREATE TYPE "gym_db"."item_ingrediente" AS (
      ingrediente_id INT,
      gramos NUMERIC
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "gym_db"."resources_categories" (
  "id_resources_categories" SERIAL PRIMARY KEY,
  "id_account" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "edited_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "gym_db"."generic_status" NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS "gym_db"."resources_media" (
  "id_resources_media" SERIAL PRIMARY KEY,
  "category_id" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "link" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "edited_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "gym_db"."generic_status" NOT NULL DEFAULT 'active'
);
