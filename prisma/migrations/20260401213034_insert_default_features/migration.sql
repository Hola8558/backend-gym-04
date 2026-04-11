-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('owner', 'coach', 'customer');

-- CreateEnum
CREATE TYPE "account_type" AS ENUM ('gym', 'coach', 'studio', 'enterprise');

-- CreateEnum
CREATE TYPE "generic_status" AS ENUM ('active', 'pending', 'inactive', 'deleted');

-- CreateEnum
CREATE TYPE "muscular_group" AS ENUM ('pecho', 'espalda', 'hombro_anterior', 'hombro_lateral', 'hombro_posterior', 'biceps', 'triceps', 'cuadriceps', 'femorales', 'gluteos', 'pantorrillas', 'core');

-- CreateTable
CREATE TABLE "accounts" (
    "id_account" SERIAL NOT NULL,
    "name" TEXT,
    "type" "account_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "status" "generic_status" NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id_account")
);

-- CreateTable
CREATE TABLE "users" (
    "id_user" SERIAL NOT NULL,
    "id_account" INTEGER NOT NULL,
    "branch" TEXT,
    "user_number" TEXT,
    "email" TEXT,
    "password_hash" TEXT,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "status" "generic_status" NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id_user" INTEGER NOT NULL,
    "id_coach" INTEGER,
    "name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "emergency_phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "status" "generic_status" NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "membership_types" (
    "id_account" INTEGER NOT NULL,
    "id_membership_type" INTEGER NOT NULL,
    "name" TEXT,
    "duration_days" INTEGER,
    "price" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL,
    "status" "generic_status" NOT NULL,

    CONSTRAINT "membership_types_pkey" PRIMARY KEY ("id_account","id_membership_type")
);

-- CreateTable
CREATE TABLE "customer_memberships" (
    "id_customer_membership" SERIAL NOT NULL,
    "id_account" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "id_membership_type" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL,
    "status" "generic_status" NOT NULL,

    CONSTRAINT "customer_memberships_pkey" PRIMARY KEY ("id_customer_membership")
);

-- CreateTable
CREATE TABLE "routines" (
    "id_routine" SERIAL NOT NULL,
    "id_account" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "name" TEXT,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "status" "generic_status" NOT NULL,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id_routine")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id_exercise" SERIAL NOT NULL,
    "name" TEXT,
    "muscular_group" "muscular_group" NOT NULL,
    "description" TEXT,
    "url" TEXT,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id_exercise")
);

-- CreateTable
CREATE TABLE "exercises_favs" (
    "id_account" INTEGER NOT NULL,
    "id_exercise" INTEGER NOT NULL,

    CONSTRAINT "exercises_favs_pkey" PRIMARY KEY ("id_account","id_exercise")
);

-- CreateTable
CREATE TABLE "entry_logs" (
    "id_user" INTEGER NOT NULL,
    "id_entry_log" SERIAL NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "status" "generic_status" NOT NULL,

    CONSTRAINT "entry_logs_pkey" PRIMARY KEY ("id_user","id_entry_log")
);

-- CreateTable
CREATE TABLE "features" (
    "id_feature" SERIAL NOT NULL,
    "id_feature_parent" INTEGER,
    "name" TEXT,
    "role" "user_role" NOT NULL,
    "customizable" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "status" "generic_status" NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id_feature")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id_user" INTEGER NOT NULL,
    "id_feature" INTEGER NOT NULL,
    "status" "generic_status" NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id_user","id_feature")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_memberships_id_user_key" ON "customer_memberships"("id_user");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_coach_fkey" FOREIGN KEY ("id_coach") REFERENCES "users"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_types" ADD CONSTRAINT "membership_types_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_memberships" ADD CONSTRAINT "customer_memberships_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_memberships" ADD CONSTRAINT "customer_memberships_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_memberships" ADD CONSTRAINT "customer_memberships_id_account_id_membership_type_fkey" FOREIGN KEY ("id_account", "id_membership_type") REFERENCES "membership_types"("id_account", "id_membership_type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises_favs" ADD CONSTRAINT "exercises_favs_id_account_fkey" FOREIGN KEY ("id_account") REFERENCES "accounts"("id_account") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises_favs" ADD CONSTRAINT "exercises_favs_id_exercise_fkey" FOREIGN KEY ("id_exercise") REFERENCES "exercises"("id_exercise") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_logs" ADD CONSTRAINT "entry_logs_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_id_feature_parent_fkey" FOREIGN KEY ("id_feature_parent") REFERENCES "features"("id_feature") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_id_feature_fkey" FOREIGN KEY ("id_feature") REFERENCES "features"("id_feature") ON DELETE RESTRICT ON UPDATE CASCADE;
