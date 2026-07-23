async function seedExpenses(prisma, h, admin) {
  const records = [];
  const categories = Object.entries(h.EXPENSE_CATEGORIES);

  for (let i = 0; i < 180; i++) {
    const [desc, cat] = categories[i % categories.length];
    const month = 3 + (i % 10);
    const day = 1 + (i % 28);
    const baseAmount = desc === 'Electricity' ? 8000 + (i % 5) * 200
      : desc === 'Cleaning' ? 3000 + (i % 5) * 100
      : desc === 'Security' ? 12000 + (i % 5) * 500
      : desc === 'Repairs' ? 5000 + (i % 5) * 500
      : desc === 'Internet' ? 2500 + (i % 5) * 100
      : desc === 'Furniture' ? 15000 + (i % 3) * 2000
      : desc === 'Software' ? 2000 + (i % 4) * 500
      : desc === 'Stationery' ? 1500 + (i % 5) * 200
      : desc === 'Generator Diesel' ? 6000 + (i % 4) * 300
      : desc === 'Water' ? 2000 + (i % 5) * 100
      : 3000;

    records.push({
      description: `${desc} - ${h.pickRandom(['Monthly','Quarterly','Weekly','Annual'], i)}`,
      amount: baseAmount,
      date: new Date(2025 + Math.floor(i / 60), month, day),
      category: cat,
      createdById: admin.id,
      createdAt: new Date(2025 + Math.floor(i / 60), month, day)
    });
  }

  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await prisma.maintenanceExpense.createMany({ data: batch });
  }

  const expenses = await prisma.maintenanceExpense.findMany({ orderBy: { id: 'asc' } });
  console.log(`Created ${expenses.length} expense records`);
  return expenses;
}

module.exports = { seedExpenses };
