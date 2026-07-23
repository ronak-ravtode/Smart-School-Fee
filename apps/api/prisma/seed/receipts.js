async function seedReceipts(prisma, h, transactions, students) {
  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  const successTx = transactions.filter(t => t.status === 'success' && t.receiptNumber);

  const records = [];
  let receiptNum = 0;

  for (const tx of successTx) {
    receiptNum++;
    const s = studentMap[tx.studentId];
    const recNumber = tx.receiptNumber || `REC-2026-${String(receiptNum).padStart(4, '0')}`;

    records.push({
      transactionId: tx.id,
      receiptNumber: recNumber,
      fileUrl: `/receipts/${recNumber}.pdf`,
      createdAt: tx.createdAt
    });
  }

  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await prisma.receipt.createMany({ data: batch });
  }

  const receipts = await prisma.receipt.findMany({ orderBy: { id: 'asc' } });
  console.log(`Created ${receipts.length} receipt records`);
  return receipts;
}

module.exports = { seedReceipts };
