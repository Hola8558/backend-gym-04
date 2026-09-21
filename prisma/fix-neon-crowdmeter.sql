-- Ensure Crowdmeter table exists in gym_db (from migration 20260625160200)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'gym_db' AND t.typname = 'CrowdmeterDay'
  ) THEN
    CREATE TYPE "gym_db"."CrowdmeterDay" AS ENUM ('now', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "gym_db"."Crowdmeter" (
  "id" SERIAL NOT NULL,
  "id_account" INTEGER NOT NULL,
  "identifier" "gym_db"."CrowdmeterDay" NOT NULL,
  "data" JSONB NOT NULL,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Crowdmeter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Crowdmeter_id_account_identifier_key"
  ON "gym_db"."Crowdmeter" ("id_account", "identifier");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Crowdmeter_id_account_fkey'
  ) THEN
    ALTER TABLE "gym_db"."Crowdmeter"
      ADD CONSTRAINT "Crowdmeter_id_account_fkey"
      FOREIGN KEY ("id_account") REFERENCES "gym_db"."accounts" ("id_account")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
