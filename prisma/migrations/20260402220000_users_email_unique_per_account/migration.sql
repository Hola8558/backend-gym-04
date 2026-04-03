-- CreateIndex
CREATE UNIQUE INDEX "users_id_account_email_key" ON "users"("id_account", "email");
