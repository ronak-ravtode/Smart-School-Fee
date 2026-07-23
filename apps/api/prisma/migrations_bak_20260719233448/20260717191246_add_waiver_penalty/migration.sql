-- CreateTable
CREATE TABLE "waivers_penalties" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "fee_assignment_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "approved_by_id" INTEGER,
    "approved_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waivers_penalties_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "waivers_penalties" ADD CONSTRAINT "waivers_penalties_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waivers_penalties" ADD CONSTRAINT "waivers_penalties_fee_assignment_id_fkey" FOREIGN KEY ("fee_assignment_id") REFERENCES "fee_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waivers_penalties" ADD CONSTRAINT "waivers_penalties_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "guardians"("id") ON DELETE SET NULL ON UPDATE CASCADE;
