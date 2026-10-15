-- Kiosk customer search / tenant role listings: users WHERE id_account = ? AND role = ? AND status = ?
CREATE INDEX IF NOT EXISTS "users_id_account_role_status_idx" ON "users"("id_account", "role", "status");
