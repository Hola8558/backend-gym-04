-- CreateEnum
CREATE TYPE "ban_status" AS ENUM ('ACTIVE', 'LIFTED');

-- AlterEnum
ALTER TYPE "generic_status" ADD VALUE 'banned';

-- CreateTable
CREATE TABLE "customer_bans" (
    "id_ban" SERIAL NOT NULL,
    "id_account" INTEGER NOT NULL,
    "id_customer" INTEGER NOT NULL,
    "id_coach" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ban_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "customer_bans_pkey" PRIMARY KEY ("id_ban")
);

-- AddForeignKey
ALTER TABLE "customer_bans" ADD CONSTRAINT "customer_bans_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_bans" ADD CONSTRAINT "customer_bans_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_bans" ADD CONSTRAINT "customer_bans_id_coach_fkey" FOREIGN KEY ("id_coach") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
