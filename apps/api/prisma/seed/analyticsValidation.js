async function validateAnalytics(prisma, h) {
  console.log('\nValidating relational integrity...');

  const violations = [];

  const orphanStudents = await prisma.student.findMany({
    where: { guardianId: { not: undefined } },
    include: { guardian: true }
  }).then(rows => rows.filter(r => !r.guardian));
  if (orphanStudents.length) violations.push(`Orphan students: ${orphanStudents.length}`);

  const orphanKyc = await prisma.studentKYC.findMany({
    include: { student: true }
  }).then(rows => rows.filter(r => !r.student));
  if (orphanKyc.length) violations.push(`Orphan KYC: ${orphanKyc.length}`);

  const orphanAssignments = await prisma.feeAssignment.findMany({
    include: { student: true, feeStructure: true }
  }).then(rows => rows.filter(r => !r.student || !r.feeStructure));
  if (orphanAssignments.length) violations.push(`Orphan fee assignments: ${orphanAssignments.length}`);

  const orphanTransactions = await prisma.transaction.findMany({
    include: { student: true, feeAssignment: true }
  }).then(rows => rows.filter(r => !r.student || !r.feeAssignment));
  if (orphanTransactions.length) violations.push(`Orphan transactions: ${orphanTransactions.length}`);

  const orphanReceipts = await prisma.receipt.findMany({
    include: { transaction: true }
  }).then(rows => rows.filter(r => !r.transaction));
  if (orphanReceipts.length) violations.push(`Orphan receipts: ${orphanReceipts.length}`);

  const orphanCheques = await prisma.chequeRecord.findMany({
    include: { transaction: true }
  }).then(rows => rows.filter(r => !r.transaction));
  if (orphanCheques.length) violations.push(`Orphan cheques: ${orphanCheques.length}`);

  const orphanWaivers = await prisma.waiverPenalty.findMany({
    include: { student: true, feeAssignment: true }
  }).then(rows => rows.filter(r => !r.student || !r.feeAssignment));
  if (orphanWaivers.length) violations.push(`Orphan waivers/penalties: ${orphanWaivers.length}`);

  const orphanExpenses = await prisma.maintenanceExpense.findMany({
    include: { createdBy: true }
  }).then(rows => rows.filter(r => !r.createdBy));
  if (orphanExpenses.length) violations.push(`Orphan expenses: ${orphanExpenses.length}`);

  const chequeTxCheck = await prisma.chequeRecord.count({
    where: { transaction: { method: { not: 'CHEQUE' } } }
  });
  if (chequeTxCheck > 0) violations.push(`Cheque records on non-CHEQUE txs: ${chequeTxCheck}`);

  const receiptTxCheck = await prisma.receipt.count({
    where: { transaction: { status: { not: 'success' } } }
  });
  if (receiptTxCheck > 0) violations.push(`Receipts on non-success txs: ${receiptTxCheck}`);

  if (violations.length > 0) {
    console.error('RELATIONAL INTEGRITY VIOLATIONS:');
    violations.forEach(v => console.error(`  FAIL: ${v}`));
    throw new Error(`Seed validation failed: ${violations.length} violation(s). Fix before proceeding.`);
  }
  console.log('Relational integrity: PASS (0 violations)');

  console.log('\nValidating dashboard consistency...');

  const totalSuccessTx = await prisma.transaction.aggregate({
    where: { status: 'success' },
    _sum: { amount: true }
  });
  const totalCollection = Number(totalSuccessTx._sum.amount || 0);
  console.log(`Total collection: ${totalCollection}`);

  const totalAssigned = await prisma.feeAssignment.findMany({
    where: { status: { in: ['pending', 'overdue', 'paid'] } },
    include: { feeStructure: true, waiverPenalties: { where: { status: 'approved' } } }
  });
  let totalPendingAmount = 0;
  totalAssigned.forEach(a => {
    if (a.status === 'pending' || a.status === 'overdue') {
      let amt = Number(a.feeStructure.amount);
      a.waiverPenalties.forEach(wp => {
        if (wp.type === 'penalty') amt += Number(wp.amount);
        else if (wp.type === 'waiver') amt -= Number(wp.amount);
      });
      totalPendingAmount += amt;
    }
  });
  console.log(`Total pending amount: ${totalPendingAmount}`);

  const chequeCount = await prisma.chequeRecord.count();
  const bouncedCount = await prisma.chequeRecord.count({ where: { depositStatus: 'bounced' } });
  const bounceRate = chequeCount > 0 ? ((bouncedCount / chequeCount) * 100).toFixed(1) : '0.0';
  console.log(`Bounce rate: ${bouncedCount}/${chequeCount} = ${bounceRate}%`);

  const totalAssignedAmount = totalAssigned.reduce((sum, a) => sum + Number(a.feeStructure.amount), 0);
  const collectionPct = totalAssignedAmount > 0
    ? ((totalCollection / totalAssignedAmount) * 100).toFixed(1) : '0.0';
  console.log(`Collection %: ${collectionPct}`);

  console.log('\nValidating distributions...');

  const txMethods = await prisma.transaction.groupBy({ by: ['method'], _count: true, _sum: { amount: true } });
  const totalTx = txMethods.reduce((s, m) => s + m._count, 0);
  console.log('Payment method distribution:');
  txMethods.forEach(m => {
    const pct = ((m._count / totalTx) * 100).toFixed(1);
    console.log(`  ${m.method}: ${m._count} (${pct}%) = ${Number(m._sum.amount).toFixed(2)}`);
  });

  const txStatuses = await prisma.transaction.groupBy({ by: ['status'], _count: true });
  const totalTxByStatus = txStatuses.reduce((s, m) => s + m._count, 0);
  console.log('Transaction status distribution:');
  txStatuses.forEach(s => {
    const pct = ((s._count / totalTxByStatus) * 100).toFixed(1);
    console.log(`  ${s.status}: ${s._count} (${pct}%)`);
  });

  const chequeStatuses = await prisma.chequeRecord.groupBy({ by: ['depositStatus'], _count: true });
  const totalCheques = chequeStatuses.reduce((s, c) => s + c._count, 0);
  console.log('Cheque status distribution:');
  chequeStatuses.forEach(c => {
    const pct = ((c._count / totalCheques) * 100).toFixed(1);
    console.log(`  ${c.depositStatus}: ${c._count} (${pct}%)`);
  });

  const kycFlagged = await prisma.studentKYC.groupBy({ by: ['ocrFlagged'], _count: true });
  console.log('KYC flagged distribution:');
  kycFlagged.forEach(k => console.log(`  ocrFlagged=${k.ocrFlagged}: ${k._count}`));

  const assignStatuses = await prisma.feeAssignment.groupBy({ by: ['status'], _count: true });
  console.log('Fee assignment status distribution:');
  assignStatuses.forEach(a => console.log(`  ${a.status}: ${a._count}`));

  const feeByType = await prisma.feeStructure.groupBy({ by: ['type'], _count: true });
  console.log('Fee structure type distribution:');
  feeByType.forEach(f => console.log(`  ${f.type}: ${f._count}`));

  const studentsByClass = await prisma.student.groupBy({ by: ['class'], _count: true, orderBy: { _count: { class: 'desc' } } });
  const maxInClass = studentsByClass[0];
  console.log(`Students in largest class: ${maxInClass.class} = ${maxInClass._count}`);

  const txByMonth = await prisma.transaction.findMany({
    where: { status: 'success' },
    select: { createdAt: true, amount: true }
  });
  const monthlyMap = {};
  txByMonth.forEach(t => {
    const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + Number(t.amount);
  });
  console.log('Monthly revenue (successful):');
  Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, amt]) => console.log(`  ${month}: ${amt.toFixed(2)}`));

  const studentStatuses = await prisma.student.groupBy({ by: ['status'], _count: true });
  console.log('Student status distribution:');
  studentStatuses.forEach(s => console.log(`  ${s.status}: ${s._count}`));

  const kycBanking = await prisma.studentKYC.groupBy({ by: ['isBankingComplete'], _count: true });
  console.log('KYC banking complete:');
  kycBanking.forEach(k => console.log(`  isBankingComplete=${k.isBankingComplete}: ${k._count}`));

  console.log('\n========================================');
  console.log('Validation complete: ALL CHECKS PASSED');
  console.log('========================================');
}

module.exports = { validateAnalytics };
