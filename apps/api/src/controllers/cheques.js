const prisma = require('../config/db');
const { generateReceiptBase64 } = require('./payments');

// List all cheque records
const getCheques = async (req, res) => {
  try {
    const cheques = await prisma.chequeRecord.findMany({
      include: {
        transaction: {
          include: {
            student: { include: { guardian: true } },
            feeAssignment: { include: { feeStructure: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(cheques);
  } catch (error) {
    console.error('Get cheques error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Deposit cheque: transition deposit_status -> 'bank_pending'
const depositCheque = async (req, res) => {
  try {
    const { id } = req.params;

    const cheque = await prisma.chequeRecord.findUnique({
      where: { id: Number(id) }
    });

    if (!cheque) {
      return res.status(404).json({ error: 'Cheque record not found' });
    }

    const updatedCheque = await prisma.chequeRecord.update({
      where: { id: cheque.id },
      data: { depositStatus: 'bank_pending' }
    });

    // Update the parent transaction depositedAt timestamp
    await prisma.transaction.update({
      where: { id: cheque.transactionId },
      data: { depositedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'deposit_cheque',
        entity: 'cheque_record',
        entityId: cheque.id,
        before: { id: cheque.id, depositStatus: cheque.depositStatus },
        after: { id: cheque.id, depositStatus: 'bank_pending' }
      }
    });

    return res.status(200).json(updatedCheque);
  } catch (error) {
    console.error('Deposit cheque error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Bounce cheque: transition deposit_status -> 'bounced', reopen fee, apply ₹500 penalty, notify guardian
const bounceCheque = async (req, res) => {
  try {
    const { id } = req.params;
    const { bounce_reason } = req.body;

    const cheque = await prisma.chequeRecord.findUnique({
      where: { id: Number(id) },
      include: {
        transaction: {
          include: {
            student: { include: { guardian: true } },
            feeAssignment: { include: { feeStructure: true } }
          }
        }
      }
    });

    if (!cheque) {
      return res.status(404).json({ error: 'Cheque record not found' });
    }

    let penaltyRecord;

    await prisma.$transaction(async (tx) => {
      // 1. Update cheque status to bounced
      await tx.chequeRecord.update({
        where: { id: cheque.id },
        data: {
          depositStatus: 'bounced',
          bounceReason: bounce_reason || 'Insufficient funds'
        }
      });

      // 2. Reopen fee assignment (status: 'pending')
      await tx.feeAssignment.update({
        where: { id: cheque.transaction.feeAssignmentId },
        data: { status: 'pending' }
      });

      // 3. Mark transaction as failed
      await tx.transaction.update({
        where: { id: cheque.transactionId },
        data: { status: 'failed' }
      });

      // 4. Apply a ₹500 bounce penalty
      penaltyRecord = await tx.waiverPenalty.create({
        data: {
          studentId: cheque.transaction.studentId,
          feeAssignmentId: cheque.transaction.feeAssignmentId,
          amount: 500.00,
          type: 'penalty',
          reason: `Cheque bounce: ${bounce_reason || 'Insufficient funds'}`,
          approvedById: req.user.id,
          approvedAt: new Date()
        }
      });

      // 5. Send mock notification SMS/email
      console.log(`\n--- [SMS/EMAIL NOTIFICATION] ---\nTo: ${cheque.transaction.student.guardian.mobile} / ${cheque.transaction.student.guardian.email}\nDear ${cheque.transaction.student.guardian.name},\nYour cheque for ₹${Number(cheque.transaction.amount).toFixed(2)} has bounced. The linked fee assignment has been reopened, and a cheque bounce penalty of ₹500.00 has been applied.\n---------------------------------\n`);

      // 6. Log audit trail
      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          actorRole: req.user.role,
          action: 'bounce_cheque',
          entity: 'cheque_record',
          entityId: cheque.id,
          before: { id: cheque.id, depositStatus: cheque.depositStatus },
          after: { id: cheque.id, depositStatus: 'bounced', penaltyId: penaltyRecord.id }
        }
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Cheque bounce processed successfully',
      cheque: { ...cheque, depositStatus: 'bounced', bounceReason: bounce_reason },
      penalty: penaltyRecord
    });

  } catch (error) {
    console.error('Bounce cheque error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Clear cheque: transition deposit_status -> 'cleared', mark transaction success, generate receipt
const clearCheque = async (req, res) => {
  try {
    const { id } = req.params;

    const cheque = await prisma.chequeRecord.findUnique({
      where: { id: Number(id) },
      include: {
        transaction: {
          include: {
            student: { include: { guardian: true } },
            feeAssignment: { include: { feeStructure: true } }
          }
        }
      }
    });

    if (!cheque) {
      return res.status(404).json({ error: 'Cheque record not found' });
    }

    if (cheque.depositStatus === 'cleared') {
      return res.status(200).json(cheque);
    }

    let updatedCheque;

    await prisma.$transaction(async (tx) => {
      // 1. Update cheque status
      updatedCheque = await tx.chequeRecord.update({
        where: { id: cheque.id },
        data: { depositStatus: 'cleared' }
      });

      // 2. Generate sequential receipt number
      const currentYear = new Date().getFullYear();
      const successTxs = await tx.transaction.findMany({
        where: {
          status: 'success',
          receiptNumber: { startsWith: `REC-${currentYear}-` }
        }
      });

      let nextNum = 1;
      if (successTxs.length > 0) {
        const nums = successTxs.map(t => {
          const parts = t.receiptNumber.split('-');
          if (parts.length === 3) {
            const seq = parseInt(parts[2], 10);
            return isNaN(seq) ? 0 : seq;
          }
          return 0;
        });
        nextNum = Math.max(...nums) + 1;
      }
      const receiptNumber = `REC-${currentYear}-${String(nextNum).padStart(4, '0')}`;

      // 3. Mark transaction as success and set receipt number
      const updatedTx = await tx.transaction.update({
        where: { id: cheque.transactionId },
        data: {
          status: 'success',
          receiptNumber
        }
      });

      // 4. Mark fee assignment as paid
      await tx.feeAssignment.update({
        where: { id: cheque.transaction.feeAssignmentId },
        data: { status: 'paid' }
      });

      // 5. Generate Receipt
      const receiptBase64 = await generateReceiptBase64(
        updatedTx,
        cheque.transaction.student,
        cheque.transaction.student.guardian,
        cheque.transaction.feeAssignment.feeStructure
      );

      await tx.receipt.create({
        data: {
          transactionId: cheque.transactionId,
          receiptNumber,
          fileUrl: receiptBase64
        }
      });

      // 6. Log audit
      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          actorRole: req.user.role,
          action: 'clear_cheque',
          entity: 'cheque_record',
          entityId: cheque.id,
          before: { id: cheque.id, depositStatus: cheque.depositStatus },
          after: { id: cheque.id, depositStatus: 'cleared', receiptNumber }
        }
      });
    });

    return res.status(200).json(updatedCheque);

  } catch (error) {
    console.error('Clear cheque error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCheques,
  depositCheque,
  bounceCheque,
  clearCheque
};
