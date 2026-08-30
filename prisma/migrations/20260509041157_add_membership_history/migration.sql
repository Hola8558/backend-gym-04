/*
  Warnings:

  - Made the column `id_account` on table `routines` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_user` on table `routines` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "routines" DROP CONSTRAINT "routines_id_account_fkey";

-- DropForeignKey
ALTER TABLE "routines" DROP CONSTRAINT "routines_id_user_fkey";

-- AlterTable
ALTER TABLE "routines" ALTER COLUMN "id_account" SET NOT NULL,
ALTER COLUMN "id_user" SET NOT NULL;

-- CreateIndex
CREATE INDEX "routines_id_account_id_user_idx" ON "routines"("id_account", "id_user");

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;
