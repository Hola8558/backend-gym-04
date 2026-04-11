CREATE TABLE "gym_db"."account_details" (
    -- 1. The Primary Key
    "id_account_detail" SERIAL NOT NULL,
    
    -- 2. The Foreign Key (Must be UNIQUE for a 1:1 relationship)
    "id_account" INTEGER NOT NULL UNIQUE,
    
    -- 3. Your limits and tiers
    "customers_limit" INTEGER NOT NULL DEFAULT 40,

    CONSTRAINT "account_details_pkey" PRIMARY KEY ("id_account_detail"),
    
    -- 4. The Relation with ON DELETE CASCADE
    CONSTRAINT "account_details_id_account_fkey" 
        FOREIGN KEY ("id_account") 
        REFERENCES "gym_db"."accounts"("id_account") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);