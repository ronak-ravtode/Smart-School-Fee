-- AlterTable
ALTER TABLE "students" ADD COLUMN     "dob" DATE,
ADD COLUMN     "ocr_flagged" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "academic_years" (
    "id" SERIAL NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" SERIAL NOT NULL,
    "academic_year_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "applies_to" VARCHAR(50) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_assignments" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "fee_structure_id" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_kyc" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "doc_type" VARCHAR(50) NOT NULL,
    "doc_ref" VARCHAR(50),
    "ocr_data" JSONB NOT NULL,
    "ocr_flagged" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_kyc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_kyc_student_id_key" ON "student_kyc"("student_id");

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_fee_structure_id_fkey" FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_kyc" ADD CONSTRAINT "student_kyc_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
