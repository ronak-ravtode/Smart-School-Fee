async function seedCheques(prisma, h, transactions) {
  const chequeTx = transactions.filter(t => t.method === 'CHEQUE');

  if (chequeTx.length === 0) {
    console.log('No cheque transactions found, skipping cheque records');
    return [];
  }

  const records = [];

  let chequeIdx = 0;
  for (const tx of chequeTx) {
    const depStatus = h.weightedPick(h.CHEQUE_STATUSES, h.CHEQUE_WEIGHTS, chequeIdx);
    chequeIdx++;
    const isBounced = depStatus === 'bounced';

    records.push({
      transactionId: tx.id,
      chequeNo: `CHQ${String(100000 + (tx.id % 900000)).padStart(6, '0')}`,
      bank: h.pickRandom(h.INDIAN_BANKS, tx.id),
      depositStatus: depStatus,
      bounceReason: isBounced ? h.pickRandom(h.BOUNCE_REASONS, tx.id) : null,
      createdAt: tx.createdAt
    });
  }

  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await prisma.chequeRecord.createMany({ data: batch });
  }

  const cheques = await prisma.chequeRecord.findMany({ orderBy: { id: 'asc' } });
  console.log(`Created ${cheques.length} cheque records`);
  return cheques;
}

module.exports = { seedCheques };
