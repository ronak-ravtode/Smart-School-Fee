const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const { seedAcademicYears } = require('./seed/academicYears');
const { seedUsers } = require('./seed/users');
const { seedFeeStructures } = require('./seed/feeStructures');
const { seedGuardians } = require('./seed/guardians');
const { seedStudents } = require('./seed/students');
const { seedKyc } = require('./seed/kyc');
const { seedFeeAssignments } = require('./seed/feeAssignments');
const { seedTransactions } = require('./seed/transactions');
const { seedReceipts } = require('./seed/receipts');
const { seedCheques } = require('./seed/cheques');
const { seedWaivers } = require('./seed/waivers');
const { seedExpenses } = require('./seed/expenses');
const { seedAuditLogs } = require('./seed/auditLogs');
const { seedEdgeCases } = require('./seed/edgeCases');
const { validateAnalytics } = require('./seed/analyticsValidation');
const h = require('./seed/helpers');

async function main() {
  console.log('Seeding Smart School database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.maintenanceExpense.deleteMany();
  await prisma.waiverPenalty.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.chequeRecord.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.studentKYC.deleteMany();
  await prisma.feeAssignment.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.cashier.deleteMany();
  await prisma.student.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.guardian.deleteMany();

  const academicYears = await seedAcademicYears(prisma);
  const { admin, principal, financeAdmin, cashierGuardians, cashiers, allStaff } =
    await seedUsers(prisma, h, passwordHash);
  const feeStructures = await seedFeeStructures(prisma, h, academicYears);
  const guardians = await seedGuardians(prisma, h, passwordHash);
  const students = await seedStudents(prisma, h, guardians);
  const kycRecords = await seedKyc(prisma, h, students);
  const assignments = await seedFeeAssignments(prisma, h, students, feeStructures, academicYears);
  const transactions = await seedTransactions(prisma, h, students, assignments, cashiers);
  const receipts = await seedReceipts(prisma, h, transactions, students);
  const cheques = await seedCheques(prisma, h, transactions);
  const { waivers, penalties } = await seedWaivers(prisma, h, students, assignments, admin);
  const expenses = await seedExpenses(prisma, h, admin);
  const auditLogs = await seedAuditLogs(prisma, h, admin, guardians, students, transactions);
  await seedEdgeCases(prisma, h, students, guardians, assignments, transactions, admin, feeStructures);

  await validateAnalytics(prisma, h);

  const finalStudents = await prisma.student.count();
  const finalAssignments = await prisma.feeAssignment.count();
  const finalTransactions = await prisma.transaction.count();
  const finalReceipts = await prisma.receipt.count();
  const finalCheques = await prisma.chequeRecord.count();
  const finalWaivers = await prisma.waiverPenalty.count({ where: { type: 'waiver' } });
  const finalPenalties = await prisma.waiverPenalty.count({ where: { type: 'penalty' } });
  const finalExpenses = await prisma.maintenanceExpense.count();
  const finalAuditLogs = await prisma.auditLog.count();

  console.log('\nSeed Summary:');
  console.log(`  Academic Years: ${academicYears.length}`);
  console.log(`  Staff Accounts: ${allStaff.length}`);
  console.log(`  Cashiers: ${cashiers.length}`);
  console.log(`  Fee Structures: ${feeStructures.length}`);
  console.log(`  Guardians: ${guardians.length}`);
  console.log(`  Students: ${finalStudents}`);
  console.log(`  KYC Records: ${kycRecords.length}`);
  console.log(`  Fee Assignments: ${finalAssignments}`);
  console.log(`  Transactions: ${finalTransactions}`);
  console.log(`  Receipts: ${finalReceipts}`);
  console.log(`  Cheque Records: ${finalCheques}`);
  console.log(`  Waivers: ${finalWaivers}`);
  console.log(`  Penalties: ${finalPenalties}`);
  console.log(`  Expenses: ${finalExpenses}`);
  console.log(`  Audit Logs: ${finalAuditLogs}`);
  console.log('\nDatabase seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
