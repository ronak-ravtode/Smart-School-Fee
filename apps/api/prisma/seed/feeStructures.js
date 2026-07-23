async function seedFeeStructures(prisma, h, academicYears) {
  const records = [];

  for (const ay of academicYears) {
    for (const cls of h.CLASSES) {
      const tuitionAmount = h.feeAmountForClass(cls, 'tuition');
      const transportAmount = h.feeAmountForClass(cls, 'transport');
      const otherAmount = h.feeAmountForClass(cls, 'other');

      records.push({
        academicYearId: ay.id,
        name: `Tuition Fee - ${cls}`,
        amount: tuitionAmount,
        type: 'tuition',
        appliesTo: cls,
        version: 1
      });

      if (h.CLASSES.indexOf(cls) % 4 !== 0) {
        records.push({
          academicYearId: ay.id,
          name: `Transport Fee - ${cls}`,
          amount: transportAmount,
          type: 'transport',
          appliesTo: cls,
          version: 1
        });
      }

      records.push({
        academicYearId: ay.id,
        name: `Activity Fee - ${cls}`,
        amount: otherAmount,
        type: 'other',
        appliesTo: cls,
        version: 1
      });
    }
  }

  records.push({
    academicYearId: academicYears[2].id,
    name: 'Computer Lab Fee',
    amount: 3500,
    type: 'other',
    appliesTo: 'all',
    version: 1
  });

  records.push({
    academicYearId: academicYears[2].id,
    name: 'Sports Fee',
    amount: 2500,
    type: 'other',
    appliesTo: 'all',
    version: 1
  });

  records.push({
    academicYearId: academicYears[1].id,
    name: 'Tuition Fee - All Classes (Archived)',
    amount: 20000,
    type: 'tuition',
    appliesTo: 'all',
    version: 2,
  });

  await prisma.feeStructure.createMany({ data: records });
  const created = await prisma.feeStructure.findMany({ orderBy: { id: 'asc' } });
  console.log(`Created ${created.length} fee structures`);
  return created;
}

module.exports = { seedFeeStructures };
