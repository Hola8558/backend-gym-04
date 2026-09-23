-- Recovery after fix-muscular-group-enum.sql failed on SET NOT NULL.
-- Run in Neon SQL Editor with search_path / gym_db qualifiers.

SET search_path TO gym_db;

-- 1) See nulls / current distribution
SELECT muscular_group::text AS grp, COUNT(*) AS n
FROM exercises
GROUP BY 1
ORDER BY n DESC;

-- 2) Fill nulls (unknown / missing group → chest as safe default)
UPDATE exercises
SET muscular_group = 'chest'::muscular_group_new
WHERE muscular_group IS NULL;

-- If the type was already renamed to muscular_group, use this instead of the UPDATE above:
-- UPDATE exercises
-- SET muscular_group = 'chest'::muscular_group
-- WHERE muscular_group IS NULL;

-- 3) Enforce NOT NULL
ALTER TABLE exercises ALTER COLUMN muscular_group SET NOT NULL;

-- 4) Finish rename/cleanup only if still pending
DROP FUNCTION IF EXISTS map_muscular_group_label(text);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'gym_db' AND t.typname = 'muscular_group_new'
  ) THEN
    -- Drop old enum only if nothing still depends on it
    DROP TYPE IF EXISTS muscular_group CASCADE;
    ALTER TYPE muscular_group_new RENAME TO muscular_group;
  END IF;
END $$;

-- 5) Verify
SELECT muscular_group::text AS grp, COUNT(*) AS n
FROM exercises
GROUP BY 1
ORDER BY 1;
