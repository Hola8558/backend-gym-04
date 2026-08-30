-- Additive: keep existing rows (manual POST /accounts) with NULL.
ALTER TABLE "account_details" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;
