-- Drop legacy composite-key entry_logs (breaking; no data migration)
DROP TABLE IF EXISTS "entry_logs";

-- CreateTable
CREATE TABLE "entry_logs" (
    "id_entry_log" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "id_account" INTEGER NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "generic_status" NOT NULL DEFAULT 'active',

    CONSTRAINT "entry_logs_pkey" PRIMARY KEY ("id_entry_log")
);

-- AddForeignKey
ALTER TABLE "entry_logs" ADD CONSTRAINT "entry_logs_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_logs" ADD CONSTRAINT "entry_logs_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE RESTRICT ON UPDATE CASCADE;
