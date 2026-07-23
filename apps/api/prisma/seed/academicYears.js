async function seedAcademicYears(prisma) {
  const years = [
    { label: '2024-25', startDate: new Date('2024-06-01'), endDate: new Date('2025-04-30'), isActive: false },
    { label: '2025-26', startDate: new Date('2025-06-01'), endDate: new Date('2026-04-30'), isActive: false },
    { label: '2026-27', startDate: new Date('2026-06-01'), endDate: new Date('2027-04-30'), isActive: true }
  ];

  await prisma.academicYear.createMany({ data: years });

  const created = await prisma.academicYear.findMany({ orderBy: { id: 'asc' } });
  console.log(`Created ${created.length} academic years`);
  return created;
}

module.exports = { seedAcademicYears };
