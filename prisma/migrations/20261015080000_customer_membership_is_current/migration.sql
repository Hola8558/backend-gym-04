-- The customer list reads customer_memberships.is_current. Without this column
-- GET /customer throws P2022 and the API process restarts.
ALTER TABLE "customer_memberships" ADD COLUMN IF NOT EXISTS "is_current" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "customer_memberships" DROP CONSTRAINT IF EXISTS "customer_memberships_id_user_key";

DROP INDEX IF EXISTS "customer_memberships_id_user_key";

CREATE UNIQUE INDEX IF NOT EXISTS "customer_memberships_one_current_per_user"
ON "customer_memberships" ("id_user")
WHERE "is_current" = true AND "status" <> 'deleted'::"generic_status";

CREATE INDEX IF NOT EXISTS "customer_memberships_id_user_is_current_idx"
ON "customer_memberships" ("id_user", "is_current");

CREATE INDEX IF NOT EXISTS "customer_memberships_id_account_status_idx"
ON "customer_memberships" ("id_account", "status");
