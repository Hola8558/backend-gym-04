-- AlterTable
ALTER TABLE "customer_bans" ADD COLUMN     "lift_reason" TEXT,
ADD COLUMN     "lifted_at" TIMESTAMP(3),
ADD COLUMN     "lifted_by" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_by" INTEGER;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_bans" ADD CONSTRAINT "customer_bans_lifted_by_fkey" FOREIGN KEY ("lifted_by") REFERENCES "users"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;
