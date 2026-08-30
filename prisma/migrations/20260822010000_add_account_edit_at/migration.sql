-- Clock for 30-day hard purge of soft-deleted accounts.
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "edit_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
