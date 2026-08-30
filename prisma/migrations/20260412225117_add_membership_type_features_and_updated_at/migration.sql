-- AlterTable
ALTER TABLE "membership_types" ADD COLUMN     "features" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
