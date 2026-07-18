const prisma = require('../config/db');
const { generateReceiptBase64 } = require('../utils/receipts');
const { decrypt } = require('../utils/crypto');

const initiateRefund = async (req, res) => {
  try {
    const { transaction_id, reason } = req.body;
    const adminId = req.user.id;

    if (!transaction_id || !reason) {
      return res.status(400).json({ error: 'transaction_id and reason are required' });
    }

    const originalTx = await prisma.transaction.findUnique({
      where: { id: Number(transaction_id) },
      include: {
        student: { include: { guardian: true } },
        feeAssignment: { include: { feeStructure: true } }
      }
    });

    if (!originalTx) {
      return res.status(404).json({ error: 'Original transaction not found' });
    }

    if (originalTx.status !== 'success') {
      return res.status(400).json({ error: 'Only successful transactions can be refunded' });
    }

    // Check if Stage 2 KYC (banking details) is complete
    const studentKYC = await prisma.studentKYC.findUnique({
      where: { studentId: originalTx.studentId }
    });

    if (!studentKYC || !studentKYC.isBankingComplete) {
      return res.status(400).json({
        error: 'Banking details required for refund. Please collect Stage 2 KYC.'
      });
    }

    // Execute refund inside database transaction block
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate sequential refund receipt number: REF-YYYY-XXXX
      const currentYear = new Date().getFullYear();
      const lastRef = await tx.transaction.findFirst({
        where: {
          status: 'reversed',
          receiptNumber: { startsWith: `REF-${currentYear}-` }
        },
        orderBy: { receiptNumber: 'desc' }
      });

      let nextRefSeq = 1;
      if (lastRef && lastRef.receiptNumber) {
        const parts = lastRef.receiptNumber.split('-');
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          nextRefSeq = lastSeq + 1;
        }
      }
      const receiptNumber = `REF-${currentYear}-${String(nextRefSeq).padStart(4, '0')}`;

      // 2. Create Reversal Transaction
      const refundTransaction = await tx.transaction.create({
        data: {
          studentId: originalTx.studentId,
          feeAssignmentId: originalTx.feeAssignmentId,
          amount: -Number(originalTx.amount), // Negative amount
          method: 'REVERSAL',
          status: 'reversed',
          gatewayRef: `REFUND_${originalTx.id}`,
          receiptNumber,
          idempotencyKey: `refund_${originalTx.id}_${Date.now()}`
        }
      });

      // 3. Reopen the associated FeeAssignment to pending
      await tx.feeAssignment.update({
        where: { id: originalTx.feeAssignmentId },
        data: { status: 'pending' }
      });

      // 4. Generate Reversal PDF Receipt
      const receiptBase64 = await generateReceiptBase64(
        refundTransaction,
        originalTx.student,
        originalTx.student.guardian,
        originalTx.feeAssignment.feeStructure
      );

      // 5. Save Receipt Record
      await tx.receipt.create({
        data: {
          transactionId: refundTransaction.id,
          receiptNumber,
          fileUrl: receiptBase64
        }
      });

      return { refundTransaction, receiptNumber, receiptBase64 };
    });

    // Generate Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: req.user.role,
        action: 'initiate_refund',
        entity: 'refund',
        entityId: result.refundTransaction.id,
        before: originalTx,
        after: result.refundTransaction
      }
    });

    // Notify Guardian (Mock SMS/Email prints)
    const decryptedAccount = decrypt(studentKYC.bankAccount);
    console.log(`\n--- [SMS/EMAIL NOTIFICATION] ---\nTo: ${originalTx.student.guardian.email}\nDear ${originalTx.student.guardian.name}, your refund of INR ${Number(originalTx.amount).toFixed(2)} has been successfully processed to Account: ****${decryptedAccount ? decryptedAccount.slice(-4) : 'N/A'}. Reason: ${reason}. Receipt: REF-${result.receiptNumber}\n---------------------------------\n`);

    return res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      refund_transaction: result.refundTransaction,
      receipt_number: result.receiptNumber
    });

  } catch (error) {
    console.error('Initiate refund error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  initiateRefund
};
