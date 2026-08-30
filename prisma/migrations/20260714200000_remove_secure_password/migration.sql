-- Remove mobile secure-tabs secondary password column (feature retired).
ALTER TABLE "users" DROP COLUMN IF EXISTS "secure_password";
