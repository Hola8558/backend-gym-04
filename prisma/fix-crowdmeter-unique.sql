-- Surgical fix for Crowdmeter (local gym_db): restore PK + business UNIQUE
-- required by prisma.crowdmeter.upsert(... id_account_identifier ...).
-- Table is empty in local DB, so no duplicate cleanup needed.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db'
      AND t.relname = 'Crowdmeter'
      AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."Crowdmeter"
      ADD CONSTRAINT "Crowdmeter_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Crowdmeter_id_account_identifier_key"
  ON "gym_db"."Crowdmeter" ("id_account", "identifier");
