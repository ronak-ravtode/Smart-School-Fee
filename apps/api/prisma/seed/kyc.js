async function seedKyc(prisma, h, students) {
  const records = [];

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const status = h.weightedPick(h.KYC_STATUSES, h.KYC_WEIGHTS, i);
    const isFlagged = status === 'ocr_flagged' || (status === 'admin_override');
    const verifiedAt = (status === 'verified' || status === 'stage2_pending' || status === 'admin_override')
      ? new Date(2026, 5, 15 + (i % 30)) : null;
    const isStage2 = status === 'stage2_pending' || status === 'admin_override';
    const isRejected = status === 'rejected';
    const isPending = status === 'pending';
    const docType = i % 3 === 0 ? 'birth_certificate' : 'aadhaar';

    records.push({
      studentId: s.id,
      docType,
      docRef: isRejected || isFlagged ? null : `XXXX-XXXX-${String(1000 + (i % 9000)).padStart(4, '0')}`,
      ocrData: {
        name: s.name,
        dob: s.dob ? s.dob.toISOString().split('T')[0] : null,
        match_confidence: isFlagged ? 45 + (i % 30) : 85 + (i % 15)
      },
      ocrFlagged: isFlagged,
      verifiedAt,
      bankAccount: isStage2 ? `XXXXXXXX${String(1000 + (i % 9000)).padStart(4, '0')}` : null,
      ifsc: isStage2 ? `SBIN00${String(1000 + (i % 9000)).padStart(4, '0')}` : null,
      passbookPhotoUrl: isStage2 ? `/uploads/passbook/student_${s.id}.jpg` : null,
      isBankingComplete: status === 'admin_override'
    });
  }

  await prisma.studentKYC.createMany({ data: records });
  const kycRecords = await prisma.studentKYC.findMany({ orderBy: { id: 'asc' } });
  console.log(`Created ${kycRecords.length} KYC records`);
  return kycRecords;
}

module.exports = { seedKyc };
