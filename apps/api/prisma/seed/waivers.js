async function seedWaivers(prisma, h, students, assignments, admin) {
  const waiverRecords = [];
  const penaltyRecords = [];
  const targetWaivers = 70;
  const targetPenalties = 120;
  let wCount = 0;
  let pCount = 0;

  const waiverTypes = Object.keys(h.WAIVER_REASONS);
  const penaltyTypes = Object.keys(h.PENALTY_REASONS);
  const WAIVER_REASONS = h.WAIVER_REASONS;
  const PENALTY_REASONS = h.PENALTY_REASONS;

  for (let i = 0; i < assignments.length && (wCount < targetWaivers || pCount < targetPenalties); i++) {
    const a = assignments[i];
    const fsAmount = 5000;

    if (wCount < targetWaivers && i % 5 === 0) {
      const wt = waiverTypes[wCount % waiverTypes.length];
      const isApproved = i % 7 !== 3;
      const amt = [2500, 5000, 7500, 10000][wCount % 4];

      waiverRecords.push({
        studentId: a.studentId,
        feeAssignmentId: a.id,
        amount: amt,
        type: 'waiver',
        reason: WAIVER_REASONS[wt] || wt,
        status: isApproved ? 'approved' : (i % 11 === 5 ? 'rejected' : 'pending'),
        rejectionReason: (i % 11 === 5) ? 'Documents insufficient for verification' : null,
        approvedById: isApproved ? admin.id : null,
        approvedAt: isApproved ? new Date(2026, 5, 20 + (wCount % 20)) : null
      });
      wCount++;
    }

    if (pCount < targetPenalties && i % 3 === 0) {
      const pt = penaltyTypes[pCount % penaltyTypes.length];
      const isApproved = i % 5 !== 2;
      const amt = pt === 'Late Fee' ? 50 + (pCount % 5) * 50
        : pt === 'Cheque Bounce' ? 500 : 200;

      penaltyRecords.push({
        studentId: a.studentId,
        feeAssignmentId: a.id,
        amount: amt,
        type: 'penalty',
        reason: PENALTY_REASONS[pt] || pt,
        status: isApproved ? 'approved' : (i % 13 === 7 ? 'rejected' : 'pending'),
        rejectionReason: (i % 13 === 7) ? 'Penalty waived due to first offense' : null,
        approvedById: isApproved ? admin.id : null,
        approvedAt: isApproved ? new Date(2026, 6, 1 + (pCount % 25)) : null
      });
      pCount++;
    }
  }

  const allRecords = [...waiverRecords, ...penaltyRecords];

  const batchSize = 100;
  for (let i = 0; i < allRecords.length; i += batchSize) {
    const batch = allRecords.slice(i, i + batchSize);
    await prisma.waiverPenalty.createMany({ data: batch });
  }

  const wp = await prisma.waiverPenalty.findMany({ orderBy: { id: 'asc' } });
  const waivers = wp.filter(w => w.type === 'waiver');
  const penalties = wp.filter(w => w.type === 'penalty');
  console.log(`Created ${waivers.length} waivers, ${penalties.length} penalties`);
  return { waivers, penalties };
}

module.exports = { seedWaivers };
