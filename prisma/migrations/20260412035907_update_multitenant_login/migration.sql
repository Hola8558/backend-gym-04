/*
  Warnings:

  - A unique constraint covering the columns `[email,id_account]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_id_account_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "users_email_id_account_key" ON "users"("email", "id_account");
