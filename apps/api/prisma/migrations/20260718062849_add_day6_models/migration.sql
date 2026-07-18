-- AlterTable
ALTER TABLE "student_kyc" ADD COLUMN     "bank_account" VARCHAR(100),
ADD COLUMN     "ifsc" VARCHAR(20),
ADD COLUMN     "is_banking_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passbook_photo_url" VARCHAR(255);

-- AlterTable
ALTER TABLE "waivers_penalties" ADD COLUMN     "rejection_reason" VARCHAR(255),
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "maintenance_expenses" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" DATE NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_expenses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "maintenance_expenses" ADD CONSTRAINT "maintenance_expenses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "guardians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
