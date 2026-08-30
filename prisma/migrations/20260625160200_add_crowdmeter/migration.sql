-- CreateEnum
CREATE TYPE "CrowdmeterDay" AS ENUM ('now', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');

-- AlterTable
ALTER TABLE "account_details" ADD COLUMN "max_capacity" INTEGER NOT NULL DEFAULT 300;

-- CreateTable
CREATE TABLE "Crowdmeter" (
    "id" SERIAL NOT NULL,
    "id_account" INTEGER NOT NULL,
    "identifier" "CrowdmeterDay" NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Crowdmeter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Crowdmeter_id_account_identifier_key" ON "Crowdmeter"("id_account", "identifier");

-- AddForeignKey
ALTER TABLE "Crowdmeter" ADD CONSTRAINT "Crowdmeter_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE RESTRICT ON UPDATE CASCADE;
