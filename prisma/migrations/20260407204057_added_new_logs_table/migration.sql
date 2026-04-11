/*
  Warnings:

  - You are about to drop the column `id_account` on the `entry_logs` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "entry_logs" DROP CONSTRAINT "entry_logs_id_account_fkey";

-- AlterTable
ALTER TABLE "account_details" ALTER COLUMN "customers_limit" DROP DEFAULT;

-- AlterTable
ALTER TABLE "entry_logs" DROP COLUMN "id_account";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "created_at",
ADD COLUMN     "edit_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id_log" SERIAL NOT NULL,
    "id_account" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id_log")
);

-- CreateIndex
CREATE INDEX "ActivityLog_id_account_created_at_idx" ON "ActivityLog"("id_account", "created_at");

-- CreateIndex
CREATE INDEX "ActivityLog_id_account_action_entity_idx" ON "ActivityLog"("id_account", "action", "entity");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
