/*
  Warnings:

  - You are about to drop the column `created_at` on the `routines` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `routines` table. All the data in the column will be lost.
  - You are about to drop the column `id_user` on the `routines` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `routines` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `routines` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "routines" DROP CONSTRAINT "routines_id_account_fkey";

-- DropForeignKey
ALTER TABLE "routines" DROP CONSTRAINT "routines_id_user_fkey";

-- AlterTable
ALTER TABLE "routines" DROP COLUMN "created_at",
DROP COLUMN "data",
DROP COLUMN "id_user",
DROP COLUMN "name",
DROP COLUMN "status",
ALTER COLUMN "id_account" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE SET NULL ON UPDATE CASCADE;
