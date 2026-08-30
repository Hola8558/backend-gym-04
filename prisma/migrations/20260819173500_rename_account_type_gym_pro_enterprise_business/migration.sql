-- Rename account plan enum values (gym -> pro, enterprise -> business)
-- and align stored customer caps with the current plan table.

ALTER TYPE "account_type" RENAME VALUE 'gym' TO 'pro';
ALTER TYPE "account_type" RENAME VALUE 'enterprise' TO 'business';

UPDATE "account_details" AS d
SET "customers_limit" = 30
FROM "accounts" AS a
WHERE d."id_account" = a."id_account"
  AND a."type" = 'coach';

UPDATE "account_details" AS d
SET "customers_limit" = 120
FROM "accounts" AS a
WHERE d."id_account" = a."id_account"
  AND a."type" = 'studio';

UPDATE "account_details" AS d
SET "customers_limit" = 500
FROM "accounts" AS a
WHERE d."id_account" = a."id_account"
  AND a."type" = 'pro';

UPDATE "account_details" AS d
SET "customers_limit" = 1000
FROM "accounts" AS a
WHERE d."id_account" = a."id_account"
  AND a."type" = 'business';
