-- CreateTable
CREATE TABLE "guardians" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'guardian',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "guardian_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "class" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "consent_checked" BOOLEAN NOT NULL DEFAULT false,
    "consent_timestamp" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashiers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_by_admin_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cashiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER,
    "actor_role" VARCHAR(20),
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guardians_mobile_key" ON "guardians"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_email_key" ON "guardians"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cashiers_user_id_key" ON "cashiers"("user_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashiers" ADD CONSTRAINT "cashiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashiers" ADD CONSTRAINT "cashiers_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "guardians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
