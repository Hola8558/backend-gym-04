-- Replace strict unique (email, id_account) with a partial index that ignores soft-deleted users.
DROP INDEX IF EXISTS "users_id_account_email_key";

CREATE UNIQUE INDEX "users_id_account_email_key"
ON "users" ("id_account", "email")
WHERE "status" <> 'deleted'::generic_status AND "email" IS NOT NULL;
