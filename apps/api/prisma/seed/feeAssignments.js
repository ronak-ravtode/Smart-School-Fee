async function seedFeeAssignments(prisma, h, students, feeStructures, academicYears) {
  const ayMap = {};
  academicYears.forEach(ay => { ayMap[ay.id] = ay; });

  const feeStructuresByAY = {};
  feeStructures.forEach(fs => {
    if (!feeStructuresByAY[fs.academicYearId]) feeStructuresByAY[fs.academicYearId] = [];
    feeStructuresByAY[fs.academicYearId].push(fs);
  });

  const records = [];
  let assignIdx = 0;

  for (const s of students) {
    for (const ay of academicYears) {
      const structures = feeStructuresByAY[ay.id] || [];
      const classStructures = structures.filter(
        fs => fs.appliesTo === s.class || fs.appliesTo === 'all'
      );

      for (const fs of classStructures) {
        if (fs.type === 'late_fee') continue;

        const termMonth = assignIdx % 2 === 0 ? 6 : 10;
        const dueDate = new Date(ay.startDate);
        dueDate.setMonth(termMonth);
        dueDate.setDate(15 + (assignIdx % 10));

        const r = (assignIdx * 7 + 3) % 13;
        let status;
        if (r < 7) status = 'paid';
        else if (r < 9) status = 'pending';
        else if (r < 11) status = 'overdue';
        else status = 'waived';

        records.push({
          studentId: s.id,
          feeStructureId: fs.id,
          dueDate,
          status
        });
        assignIdx++;
      }
    }
  }

  await prisma.feeAssignment.createMany({ data: records });
  const assignments = await prisma.feeAssignment.findMany({ orderBy: { id: 'asc' } });
  console.log(`Created ${assignments.length} fee assignments`);
  return assignments;
}

module.exports = { seedFeeAssignments };
