/*
  Warnings:

  - You are about to drop the `account_details` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "account_details" DROP CONSTRAINT "account_details_id_account_fkey";

-- DropTable
DROP TABLE "account_details";
