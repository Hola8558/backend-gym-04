-- Restore missing PRIMARY KEY / UNIQUE constraints in gym_db
-- to match prisma/schema.prisma. Idempotent. Crowdmeter already fixed separately.

DO $$
BEGIN
  -- accounts
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'accounts' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."accounts"
      ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id_account");
  END IF;

  -- account_details
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'account_details' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."account_details"
      ADD CONSTRAINT "account_details_pkey" PRIMARY KEY ("id_account_detail");
  END IF;

  -- users
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'users' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."users"
      ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id_user");
  END IF;

  -- profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'profiles' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."profiles"
      ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id_user");
  END IF;

  -- membership_types (composite)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'membership_types' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."membership_types"
      ADD CONSTRAINT "membership_types_pkey"
      PRIMARY KEY ("id_account", "id_membership_type");
  END IF;

  -- customer_memberships
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'customer_memberships' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."customer_memberships"
      ADD CONSTRAINT "customer_memberships_pkey" PRIMARY KEY ("id_customer_membership");
  END IF;

  -- membership_histories
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'membership_histories' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."membership_histories"
      ADD CONSTRAINT "membership_histories_pkey" PRIMARY KEY ("id_log");
  END IF;

  -- routines
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'routines' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."routines"
      ADD CONSTRAINT "routines_pkey" PRIMARY KEY ("id_routine");
  END IF;

  -- exercises
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'exercises' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."exercises"
      ADD CONSTRAINT "exercises_pkey" PRIMARY KEY ("id_exercise");
  END IF;

  -- exercises_favs (composite)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'exercises_favs' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."exercises_favs"
      ADD CONSTRAINT "exercises_favs_pkey"
      PRIMARY KEY ("id_account", "id_exercise");
  END IF;

  -- entry_logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'entry_logs' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."entry_logs"
      ADD CONSTRAINT "entry_logs_pkey" PRIMARY KEY ("id_entry_log");
  END IF;

  -- ActivityLog
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'ActivityLog' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."ActivityLog"
      ADD CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id_log");
  END IF;

  -- features
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'features' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."features"
      ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id_feature");
  END IF;

  -- feature_flags (composite)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'feature_flags' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."feature_flags"
      ADD CONSTRAINT "feature_flags_pkey"
      PRIMARY KEY ("id_user", "id_feature");
  END IF;

  -- customer_bans
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'customer_bans' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."customer_bans"
      ADD CONSTRAINT "customer_bans_pkey" PRIMARY KEY ("id_ban");
  END IF;

  -- resources_categories
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'resources_categories' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."resources_categories"
      ADD CONSTRAINT "resources_categories_pkey" PRIMARY KEY ("id_resources_categories");
  END IF;

  -- resources_media
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'resources_media' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."resources_media"
      ADD CONSTRAINT "resources_media_pkey" PRIMARY KEY ("id_resources_media");
  END IF;

  -- ingredients
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'ingredients' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."ingredients"
      ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id_ingredient");
  END IF;

  -- original_new_ingredients
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'original_new_ingredients' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."original_new_ingredients"
      ADD CONSTRAINT "original_new_ingredients_pkey" PRIMARY KEY ("id_original_new");
  END IF;

  -- recipes
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'recipes' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."recipes"
      ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id_recipie");
  END IF;

  -- customer_menus
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'gym_db' AND t.relname = 'customer_menus' AND c.contype = 'p'
  ) THEN
    ALTER TABLE "gym_db"."customer_menus"
      ADD CONSTRAINT "customer_menus_pkey" PRIMARY KEY ("id_menu");
  END IF;
END $$;

-- Extra UNIQUE indexes (schema @unique / @@unique beyond PK)
CREATE UNIQUE INDEX IF NOT EXISTS "account_details_id_account_key"
  ON "gym_db"."account_details" ("id_account");

CREATE UNIQUE INDEX IF NOT EXISTS "account_details_wsp_identifier_key"
  ON "gym_db"."account_details" ("wsp_identifier");

CREATE UNIQUE INDEX IF NOT EXISTS "users_user_number_key"
  ON "gym_db"."users" ("user_number");

CREATE UNIQUE INDEX IF NOT EXISTS "customer_memberships_id_user_key"
  ON "gym_db"."customer_memberships" ("id_user");
