async function seedGuardians(prisma, h, passwordHash) {
  const records = [];

  for (let i = 0; i < 220; i++) {
    const nameIdx = i + 100;
    const surname = h.pickRandom(h.ALL_SURNAMES, i);
    const name = h.generateGuardianName(nameIdx, surname);
    const mobile = h.generateMobile(i);
    const email = h.generateEmail(name, i);
    const occupation = h.pickRandom(h.OCCUPATIONS, i);

    records.push({
      name,
      mobile,
      email,
      passwordHash,
      role: 'guardian'
    });
  }

  await prisma.guardian.createMany({ data: records });

  const guardianRecords = await prisma.guardian.findMany({
    where: { role: 'guardian' },
    orderBy: { id: 'asc' }
  });

  const guardianDetails = guardianRecords.map((g, i) => ({
    ...g,
    occupation: h.pickRandom(h.OCCUPATIONS, i + 200)
  }));

  console.log(`Created ${guardianRecords.length} parent guardians`);
  return guardianDetails;
}

module.exports = { seedGuardians };
