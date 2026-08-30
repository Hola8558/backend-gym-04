-- Additive only: CREATE IF NOT EXISTS — safe when tables already exist from manual SQL.
-- Does not DROP or ALTER existing unrelated tables.

CREATE TABLE IF NOT EXISTS "ingredients" (
    "id_ingredient" SERIAL PRIMARY KEY,
    "name_es" TEXT,
    "name_en" TEXT,
    "kcal_per_100g" INTEGER,
    "emoji" TEXT,
    "weight_per_unit" INTEGER,
    "carbs_100g" INTEGER,
    "fat_100g" INTEGER,
    "protein_100g" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "original_new_ingredients" (
    "id_original_new" SERIAL PRIMARY KEY,
    "id_account" INTEGER REFERENCES "accounts"("id_account"),
    "id_original" INTEGER REFERENCES "ingredients"("id_ingredient"),
    "id_new" INTEGER NOT NULL REFERENCES "ingredients"("id_ingredient")
);

CREATE TABLE IF NOT EXISTS "recipes" (
    "id_recipie" SERIAL PRIMARY KEY,
    "id_account" INTEGER REFERENCES "accounts"("id_account"),
    "name" TEXT,
    "carb" INTEGER,
    "fat" INTEGER,
    "protein" INTEGER,
    "ingredients" INTEGER[],
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
