-- DropIndex
DROP INDEX IF EXISTS "users_id_account_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_number_key" ON "users"("user_number");
