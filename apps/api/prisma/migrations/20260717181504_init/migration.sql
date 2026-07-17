-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "fee_assignment_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "gateway_ref" VARCHAR(100),
    "receipt_number" VARCHAR(50),
    "deposited_at" TIMESTAMP,
    "idempotency_key" VARCHAR(100),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheque_records" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "cheque_no" VARCHAR(50) NOT NULL,
    "bank" VARCHAR(100) NOT NULL,
    "deposit_status" VARCHAR(20) NOT NULL DEFAULT 'deposit_pending',
    "bounce_reason" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cheque_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "receipt_number" VARCHAR(50) NOT NULL,
    "file_url" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_receipt_number_key" ON "transactions"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_idempotency_key_key" ON "transactions"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_transaction_id_key" ON "receipts"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fee_assignment_id_fkey" FOREIGN KEY ("fee_assignment_id") REFERENCES "fee_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheque_records" ADD CONSTRAINT "cheque_records_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
