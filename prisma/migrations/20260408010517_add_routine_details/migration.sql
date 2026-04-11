/*
  Warnings:

  - Added the required column `data` to the `routines` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "routines" ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "id_user" INTEGER,
ADD COLUMN     "name" TEXT;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;
