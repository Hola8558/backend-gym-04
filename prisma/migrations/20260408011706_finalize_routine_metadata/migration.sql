-- AlterTable
ALTER TABLE "routines" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "generic_status" NOT NULL DEFAULT 'active';
