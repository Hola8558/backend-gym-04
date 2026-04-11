-- CreateTable
CREATE TABLE "account_details" (
    "id_account_detail" SERIAL NOT NULL,
    "id_account" INTEGER NOT NULL,
    "customers_limit" INTEGER NOT NULL DEFAULT 40,

    CONSTRAINT "account_details_pkey" PRIMARY KEY ("id_account_detail")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_details_id_account_key" ON "account_details"("id_account");

-- AddForeignKey
ALTER TABLE "account_details" ADD CONSTRAINT "account_details_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE CASCADE ON UPDATE CASCADE;
