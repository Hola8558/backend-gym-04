-- CreateEnum
CREATE TYPE "membership_action" AS ENUM ('NEW', 'RENEWAL', 'CHANGE', 'CANCELLATION');

-- CreateTable
CREATE TABLE "membership_histories" (
    "id_log" SERIAL NOT NULL,
    "id_account" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "id_new_membership" INTEGER NOT NULL,
    "id_old_membership" INTEGER,
    "action_type" "membership_action" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_histories_pkey" PRIMARY KEY ("id_log")
);

-- CreateIndex
CREATE INDEX "membership_histories_id_account_id_user_idx" ON "membership_histories"("id_account", "id_user");

-- AddForeignKey
ALTER TABLE "membership_histories" ADD CONSTRAINT "membership_histories_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "membership_histories" ADD CONSTRAINT "membership_histories_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "membership_histories" ADD CONSTRAINT "membership_histories_id_new_membership_fkey" FOREIGN KEY ("id_new_membership") REFERENCES "customer_memberships"("id_customer_membership") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "membership_histories" ADD CONSTRAINT "membership_histories_id_old_membership_fkey" FOREIGN KEY ("id_old_membership") REFERENCES "customer_memberships"("id_customer_membership") ON DELETE SET NULL ON UPDATE CASCADE;
