CREATE TABLE IF NOT EXISTS "client_metrics" (
    "id_measure" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_account" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DECIMAL(5, 2),
    "measurements" JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT "client_metrics_pkey" PRIMARY KEY ("id_measure")
);

-- Accounts and users use integer ids. Convert a previously created uuid pair when the table is still empty.
DO $$
DECLARE
    account_type text;
    row_count bigint;
BEGIN
    SELECT format_type(a.atttypid, a.atttypmod)
    INTO account_type
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'client_metrics'
      AND a.attname = 'id_account'
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND n.nspname = current_schema();

    IF account_type = 'uuid' THEN
        SELECT COUNT(*) INTO row_count FROM "client_metrics";
        IF row_count > 0 THEN
            RAISE EXCEPTION 'client_metrics has rows; cannot convert id_account and id_user from uuid to integer';
        END IF;

        ALTER TABLE "client_metrics"
            ALTER COLUMN "id_account" TYPE INTEGER USING NULL::integer,
            ALTER COLUMN "id_user" TYPE INTEGER USING NULL::integer;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'client_metrics_id_account_fkey'
    ) THEN
        ALTER TABLE "client_metrics"
            ADD CONSTRAINT "client_metrics_id_account_fkey"
            FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'client_metrics_id_user_fkey'
    ) THEN
        ALTER TABLE "client_metrics"
            ADD CONSTRAINT "client_metrics_id_user_fkey"
            FOREIGN KEY ("id_user") REFERENCES "users"("id_user")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "client_metrics_id_account_id_user_date_idx"
    ON "client_metrics"("id_account", "id_user", "date");
