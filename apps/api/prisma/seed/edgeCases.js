async function seedEdgeCases(prisma, h, students, guardians, assignments, transactions, admin, feeStructures) {
  const edgeTx = [];
  const edgeAssignUpdates = [];

  const paidAssignments = assignments.filter(a => a.status === 'paid');
  const overdueAssignments = assignments.filter(a => a.status === 'overdue');
  const pendingAssignments = assignments.filter(a => a.status === 'pending');

  const pickSafe = (arr, idx) => arr[idx % arr.length];

  const now = new Date();
  const ayStart = new Date('2026-06-01');
  const ayEnd = new Date('2027-04-30');

  const boundaryDates = [
    { label: 'academic_year_start', date: ayStart },
    { label: 'academic_year_end', date: ayEnd },
    { label: 'leap_day', date: new Date('2024-02-29') },
    { label: 'month_end_jan', date: new Date('2026-01-31') },
    { label: 'month_end_jun', date: new Date('2026-06-30') },
    { label: 'month_end_dec', date: new Date('2026-12-31') },
    { label: 'fy_end', date: new Date('2027-03-31') },
    { label: 'today', date: now },
    { label: 'future_30d', date: new Date(now.getTime() + 30 * 86400000) },
    { label: 'future_90d', date: new Date(now.getTime() + 90 * 86400000) },
  ];

  for (let i = 0; i < boundaryDates.length; i++) {
    const bd = boundaryDates[i];
    const a = pickSafe(pendingAssignments, i);
    if (a) {
      edgeTx.push({
        studentId: a.studentId,
        feeAssignmentId: a.id,
        amount: 5000,
        method: i % 2 === 0 ? 'UPI' : 'CASH',
        status: 'success',
        gatewayRef: h.getGatewayRef(),
        receiptNumber: h.getReceiptNumber('2026'),
        idempotencyKey: h.getIdempotencyKey(),
        createdAt: bd.date
      });
    }
  }

  for (let i = 0; i < h.SPECIFIC_AMOUNTS.length; i++) {
    const amt = h.SPECIFIC_AMOUNTS[i];
    const a = pickSafe(paidAssignments, i + 50);
    if (a) {
      edgeTx.push({
        studentId: a.studentId,
        feeAssignmentId: a.id,
        amount: amt,
        method: 'UPI',
        status: amt === 0 ? 'failed' : 'success',
        gatewayRef: amt > 0 ? h.getGatewayRef() : null,
        receiptNumber: amt > 0 ? h.getReceiptNumber('2026') : null,
        idempotencyKey: h.getIdempotencyKey(),
        createdAt: new Date(2026, 6, 10 + (i % 20))
      });
    }
  }

  const offlineScenarios = [
    { label: 'waiting_sync', status: 'pending', method: 'CASH', depositedAt: null },
    { label: 'synced', status: 'success', method: 'CASH', depositedAt: new Date() },
    { label: 'failed_sync', status: 'failed', method: 'CASH', depositedAt: null },
    { label: 'duplicate_sync_attempt', status: 'pending', method: 'CASH', depositedAt: null },
    { label: 'sync_conflict', status: 'failed', method: 'CASH', depositedAt: null },
  ];

  for (let i = 0; i < offlineScenarios.length; i++) {
    const sc = offlineScenarios[i];
    const a = pickSafe(pendingAssignments, i + 200);
    if (a) {
      edgeTx.push({
        studentId: a.studentId,
        feeAssignmentId: a.id,
        amount: 4500,
        method: sc.method,
        status: sc.status,
        depositedAt: sc.depositedAt,
        idempotencyKey: h.getIdempotencyKey(),
        createdAt: new Date()
      });
    }
  }

  const guardianWithInactiveStudents = guardians.find(g => g.role === 'guardian' && g.id % 17 === 0);
  if (guardianWithInactiveStudents) {
    const kids = await prisma.student.findMany({ where: { guardianId: guardianWithInactiveStudents.id } });
    for (const kid of kids) {
      await prisma.student.update({
        where: { id: kid.id },
        data: { status: 'pending', consentChecked: false }
      });
    }
  }

  for (let i = 0; i < 3; i++) {
    const a = pickSafe(overdueAssignments, i + 100);
    if (a) {
      edgeAssignUpdates.push(
        prisma.feeAssignment.update({
          where: { id: a.id },
          data: { dueDate: new Date(now.getTime() - (i + 1) * 30 * 86400000) }
        })
      );
    }
  }

  const firstDayAssign = pickSafe(paidAssignments, 0);
  if (firstDayAssign) {
    edgeAssignUpdates.push(
      prisma.feeAssignment.update({
        where: { id: firstDayAssign.id },
        data: { dueDate: new Date('2026-01-01') }
      })
    );
  }

  if (edgeTx.length > 0) {
    await prisma.transaction.createMany({ data: edgeTx });
  }

  for (const upd of edgeAssignUpdates) {
    await upd;
  }

  const demoClass = 'Demo-A';
  const existingDemo = await prisma.student.count({ where: { class: demoClass } });
  if (existingDemo < 100) {
    const demoRecords = [];
    for (let i = 0; i < 100; i++) {
      const guardian = pickSafe(guardians, i + 50);
      const surname = guardian.name.split(' ').slice(-1)[0];
      const name = h.generateStudentName(i + 1000, surname);
      demoRecords.push({
        guardianId: guardian.id,
        name,
        class: demoClass,
        status: 'active',
        consentChecked: true,
        consentTimestamp: new Date('2026-06-01'),
        dob: new Date(2014 + (i % 6), (i % 12) + 1, (i % 28) + 1),
        ocrFlagged: false
      });
    }
    await prisma.student.createMany({ data: demoRecords });
    console.log(`Created ${demoRecords.length} students in Demo-A class for pagination`);
  }

  const demoStudents = await prisma.student.findMany({ where: { class: demoClass } });
  if (demoStudents.length >= 100) {
    const demoFeeStructures = await prisma.feeStructure.findMany({
      where: { academicYearId: (await prisma.academicYear.findFirst({ where: { isActive: true } })).id, appliesTo: { in: ['all', demoClass] } }
    });
    const demoAssignments = [];
    for (const ds of demoStudents.slice(0, 100)) {
      for (const fs of demoFeeStructures.slice(0, 3)) {
        demoAssignments.push({
          studentId: ds.id,
          feeStructureId: fs.id,
          dueDate: new Date(2026, 6 + (ds.id % 6), 15),
          status: ds.id % 10 === 0 ? 'overdue' : (ds.id % 7 === 0 ? 'pending' : 'paid')
        });
      }
    }

    if (demoAssignments.length > 0) {
      await prisma.feeAssignment.createMany({ data: demoAssignments });
      const demoPaid = await prisma.feeAssignment.findMany({
        where: { studentId: { in: demoStudents.map(s => s.id) }, status: 'paid' }
      });
      const demoTx = demoPaid.map(a => ({
        studentId: a.studentId,
        feeAssignmentId: a.id,
        amount: 20000,
        method: 'UPI',
        status: 'success',
        gatewayRef: h.getGatewayRef(),
        receiptNumber: h.getReceiptNumber('2026'),
        idempotencyKey: h.getIdempotencyKey(),
        createdAt: new Date(2026, 6, 15)
      }));
      if (demoTx.length > 0) await prisma.transaction.createMany({ data: demoTx });
    }
  }

  console.log(`Edge cases seeded: ${edgeTx.length} extra transactions, ${edgeAssignUpdates.length} assignment updates`);
}

module.exports = { seedEdgeCases };
