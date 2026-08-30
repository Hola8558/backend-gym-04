-- DropIndex
DROP INDEX IF EXISTS "users_email_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_id_account_email_key" ON "users"("id_account", "email");
