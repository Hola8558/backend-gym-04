-- Fix legacy account_type enum values before schema push
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
  JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'gym_db' AND t.typname = 'account_type' AND e.enumlabel = 'gym'
  ) THEN
    ALTER TYPE "gym_db"."account_type" RENAME VALUE 'gym' TO 'pro';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'gym_db' AND t.typname = 'account_type' AND e.enumlabel = 'enterprise'
  ) THEN
    ALTER TYPE "gym_db"."account_type" RENAME VALUE 'enterprise' TO 'business';
  END IF;
END $$;
