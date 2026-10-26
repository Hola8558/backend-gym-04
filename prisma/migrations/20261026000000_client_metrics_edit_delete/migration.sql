ALTER TABLE "client_metrics" ADD COLUMN IF NOT EXISTS "edited_at" TIMESTAMP(6);
ALTER TABLE "client_metrics" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(6);
