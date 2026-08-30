-- Align existing independent-coach account users from staff coach to solo_coach
UPDATE "users"
SET "role" = 'solo_coach'::"user_role"
WHERE "role" = 'coach'::"user_role"
  AND "id_account" IN (
    SELECT "id_account" FROM "accounts" WHERE "type" = 'coach'::"account_type"
  );

-- Mirror active owner features for solo_coach (flat copy; parent links omitted to avoid cross-role FK issues)
INSERT INTO "features" (
  "id_feature_parent",
  "name",
  "description",
  "role",
  "customizable",
  "created_at",
  "status"
)
SELECT
  NULL,
  "name",
  "description",
  'solo_coach'::"user_role",
  "customizable",
  "created_at",
  "status"
FROM "features"
WHERE "role" = 'owner'::"user_role"
  AND "status" = 'active'::"generic_status";
