async function seedStudents(prisma, h, guardians) {
  const records = [];
  const siblingGroups = [];
  let globalIdx = 0;
  let studentIdx = 0;

  for (const cls of h.CLASSES) {
    const count = h.STUDENTS_PER_CLASS[cls];

    for (let i = 0; i < count; i++) {
      const guardian = guardians[globalIdx % guardians.length];
      const surname = guardian.name.split(' ').slice(-1)[0];
      const name = h.generateStudentName(studentIdx, surname);
      const isActive = globalIdx % 15 !== 14;
      const dobYear = 2026 - parseInt(cls.match(/\d+/)?.[0] || '5') - 5;

      records.push({
        guardianId: guardian.id,
        name,
        class: cls,
        status: isActive ? 'active' : 'pending',
        consentChecked: isActive,
        consentTimestamp: isActive ? new Date('2026-06-01') : null,
        dob: new Date(`${dobYear}-${(globalIdx % 12) + 1}-${(globalIdx % 28) + 1}`),
        ocrFlagged: false
      });

      if (globalIdx % 7 === 0 && siblingGroups.length < 25) {
        siblingGroups.push({
          guardianId: guardian.id,
          indices: [studentIdx]
        });
      } else if (siblingGroups.length > 0 && siblingGroups[siblingGroups.length - 1].indices.length < 3) {
        const lastGroup = siblingGroups[siblingGroups.length - 1];
        if (lastGroup.guardianId === guardian.id) {
          lastGroup.indices.push(studentIdx);
        }
      }

      globalIdx++;
      studentIdx++;
    }
  }

  await prisma.student.createMany({ data: records });

  const students = await prisma.student.findMany({ orderBy: { id: 'asc' } });

  for (const sg of siblingGroups) {
    const sibStudents = sg.indices.map(idx => students[idx]).filter(Boolean);
    if (sibStudents.length > 1) {
      for (const s of sibStudents) {
        await prisma.student.update({
          where: { id: s.id },
          data: { guardianId: sg.guardianId }
        });
      }
    }
  }

  const finalStudents = await prisma.student.findMany({ orderBy: { id: 'asc' } });
  console.log(`Created ${finalStudents.length} students`);
  return finalStudents;
}

module.exports = { seedStudents };
