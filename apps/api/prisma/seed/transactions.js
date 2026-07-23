async function seedTransactions(prisma, h, students, assignments, cashiers) {
  const paidOrOverdue = assignments.filter(a => a.status === 'paid' || a.status === 'overdue');
  const records = [];
  const manualCashList = [];
  let txCount = 0;
  const targetTx = 2700;

  for (let i = 0; i < paidOrOverdue.length && txCount < targetTx; i++) {
    const a = paidOrOverdue[i];
    const method = h.weightedPick(h.PAYMENT_METHODS, h.PAYMENT_WEIGHTS, i);
    const status = h.weightedPick(h.TX_STATUSES, h.TX_WEIGHTS, i);

    const amount = await prisma.feeStructure.findUnique({
      where: { id: a.feeStructureId }
    }).then(fs => fs ? Number(fs.amount) : 10000);

    records.push({
      studentId: a.studentId,
      feeAssignmentId: a.id,
      amount,
      method,
      status,
      gatewayRef: status === 'success' || status === 'pending' ? h.getGatewayRef() : null,
      receiptNumber: status === 'success' ? h.getReceiptNumber('2026') : null,
      depositedAt: (method === 'CASH' && status === 'success' && i % 5 !== 0)
        ? new Date(2026, 6, 1 + (i % 25)) : null,
      idempotencyKey: h.getIdempotencyKey(),
      createdAt: new Date(2026, 5 + (i % 4), 1 + (i % 28), 10 + (i % 8), (i * 7) % 60)
    });
    txCount++;
  }

  const partialPayments = [];
  for (let i = 0; i < 30 && paidOrOverdue.length > i; i++) {
    const a = paidOrOverdue[i + 100];
    const fs = await prisma.feeStructure.findUnique({ where: { id: a.feeStructureId } });
    const fullAmount = fs ? Number(fs.amount) : 10000;
    const halfAmount = Math.round(fullAmount / 2);

    partialPayments.push({
      studentId: a.studentId,
      feeAssignmentId: a.id,
      amount: halfAmount,
      method: 'UPI',
      status: 'success',
      gatewayRef: h.getGatewayRef(),
      receiptNumber: h.getReceiptNumber('2026'),
      idempotencyKey: h.getIdempotencyKey(),
      createdAt: new Date(2026, 5 + (i % 4), 1 + (i % 28))
    });

    partialPayments.push({
      studentId: a.studentId,
      feeAssignmentId: a.id,
      amount: halfAmount,
      method: 'UPI',
      status: 'pending',
      gatewayRef: h.getGatewayRef(),
      idempotencyKey: h.getIdempotencyKey(),
      createdAt: new Date(2026, 6 + (i % 4), 1 + (i % 28))
    });
  }

  const reversedTx = [];
  for (let i = 0; i < 15 && paidOrOverdue.length > i + 200; i++) {
    const a = paidOrOverdue[i + 200];
    const amount = 5000;

    reversedTx.push({
      studentId: a.studentId,
      feeAssignmentId: a.id,
      amount,
      method: 'UPI',
      status: 'reversed',
      gatewayRef: h.getGatewayRef(),
      receiptNumber: h.getReceiptNumber('2026'),
      idempotencyKey: h.getIdempotencyKey(),
      createdAt: new Date(2026, 5 + (i % 4), 1 + (i % 28))
    });
  }

  const largeTx = [];
  for (let i = 0; i < 10; i++) {
    const a = paidOrOverdue[paidOrOverdue.length - 1 - i] || paidOrOverdue[0];
    const amounts = [250, 500, 1000, 25000, 50000, 100000];
    const amount = amounts[i % amounts.length];

    largeTx.push({
      studentId: a.studentId,
      feeAssignmentId: a.id,
      amount,
      method: i % 2 === 0 ? 'UPI' : 'CASH',
      status: 'success',
      gatewayRef: h.getGatewayRef(),
      receiptNumber: h.getReceiptNumber('2026'),
      idempotencyKey: h.getIdempotencyKey(),
      createdAt: new Date(2026, 5 + (i % 4), 1 + (i % 28))
    });
  }

  const allTxs = [...records, ...partialPayments, ...reversedTx, ...largeTx];
  await prisma.transaction.createMany({ data: allTxs });

  const transactions = await prisma.transaction.findMany({ orderBy: { id: 'asc' } });
  console.log(`Created ${transactions.length} transactions`);
  return transactions;
}

module.exports = { seedTransactions };
