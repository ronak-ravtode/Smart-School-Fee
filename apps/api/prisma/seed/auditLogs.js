async function seedAuditLogs(prisma, h, admin, guardians, students, transactions) {
  const actions = [
    'signup', 'login', 'create_cashier', 'update_consent', 'payment_init',
    'payment_success', 'payment_failed', 'payment_reversed', 'fee_assigned',
    'waiver_approved', 'waiver_rejected', 'penalty_applied', 'penalty_approved',
    'kyc_submitted', 'kyc_verified', 'kyc_rejected', 'receipt_generated',
    'student_created', 'student_updated', 'expense_recorded'
  ];

  const entities = ['guardian','student','transaction','fee_assignment','waiver_penalty','receipt','cashier'];

  const records = [];
  const targetLogs = 3000;

  for (let i = 0; i < targetLogs; i++) {
    const action = actions[i % actions.length];
    const entity = entities[i % entities.length];
    const actor = i % 4 === 0 ? admin : guardians[i % guardians.length];
    const entityId = entity === 'student' ? (students[i % students.length]?.id || 1)
      : entity === 'transaction' ? (transactions[i % transactions.length]?.id || 1)
      : entity === 'guardian' ? actor.id
      : entity === 'fee_assignment' ? 2000 + (i % 1500)
      : entity === 'receipt' ? 1000 + (i % 1000)
      : null;
    const hour = 8 + (i % 10);
    const day = 1 + (i % 28);
    const month = 3 + (i % 10);
    const year = 2026;

    records.push({
      actorId: actor.id,
      actorRole: actor.role,
      action,
      entity,
      entityId,
      before: i % 3 === 0 ? { status: 'pending' } : null,
      after: i % 3 === 0 ? { status: 'success' } : null,
      createdAt: new Date(year, month, day, hour, (i * 7) % 60)
    });
  }

  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await prisma.auditLog.createMany({ data: batch });
  }

  const auditLogs = await prisma.auditLog.findMany({ orderBy: { id: 'asc' } });
  console.log(`Created ${auditLogs.length} audit log entries`);
  return auditLogs;
}

module.exports = { seedAuditLogs };
