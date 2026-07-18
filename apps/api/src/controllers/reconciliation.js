const prisma = require('../config/db');

// Helper to check if two dates are on the same calendar day (UTC-aligned)
const isSameDay = (d1, d2) => {
  return d1.getUTCFullYear() === d2.getUTCFullYear() &&
         d1.getUTCMonth() === d2.getUTCMonth() &&
         d1.getUTCDate() === d2.getUTCDate();
};

const uploadStatement = async (req, res) => {
  try {
    const { csvText } = req.body;

    if (!csvText) {
      return res.status(400).json({ error: 'csvText body parameter is required' });
    }

    const lines = csvText.split('\n');
    const matched = [];
    const unmatched = [];

    // Fetch all successful CASH or CHEQUE transactions that have been marked deposited
    const dbTransactions = await prisma.transaction.findMany({
      where: {
        status: 'success',
        method: { in: ['CASH', 'CHEQUE'] },
        NOT: { depositedAt: null }
      },
      include: {
        student: true,
        feeAssignment: { include: { feeStructure: true } }
      }
    });

    // We keep track of which db transactions are already matched during this run to avoid double matching
    const matchedTxIds = new Set();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      if (parts.length < 2) continue;

      const dateStr = parts[0].trim();
      const amountStr = parts[1].trim();

      const statementDate = new Date(dateStr);
      const statementAmount = Number(amountStr);

      if (isNaN(statementDate.getTime()) || isNaN(statementAmount)) {
        unmatched.push({ date: dateStr, amount: amountStr, reason: 'Invalid date or amount format' });
        continue;
      }

      // Find matching transaction in our DB
      const matchingTx = dbTransactions.find(tx => {
        if (matchedTxIds.has(tx.id)) return false;
        
        const isAmountMatch = Math.abs(Number(tx.amount) - statementAmount) < 0.01;
        const isDateMatch = tx.depositedAt && isSameDay(new Date(tx.depositedAt), statementDate);
        
        return isAmountMatch && isDateMatch;
      });

      if (matchingTx) {
        matchedTxIds.add(matchingTx.id);
        matched.push({
          date: dateStr,
          amount: statementAmount,
          transactionId: matchingTx.id,
          receiptNumber: matchingTx.receiptNumber,
          studentName: matchingTx.student.name,
          feeName: matchingTx.feeAssignment.feeStructure.name,
          method: matchingTx.method
        });
      } else {
        unmatched.push({
          date: dateStr,
          amount: statementAmount
        });
      }
    }

    // Generate Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'reconcile_upload',
        entity: 'reconciliation',
        entityId: null,
        before: null,
        after: { matchedCount: matched.length, unmatchedCount: unmatched.length }
      }
    });

    return res.status(200).json({
      success: true,
      matched,
      unmatched
    });

  } catch (error) {
    console.error('Upload statement error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  uploadStatement
};
