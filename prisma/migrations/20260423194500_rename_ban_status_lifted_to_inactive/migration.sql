-- Rename PostgreSQL enum label only (preserves audit rows).
ALTER TYPE "ban_status" RENAME VALUE 'LIFTED' TO 'INACTIVE';
