async function seedUsers(prisma, h, passwordHash) {
  const staffData = [
    { name: 'Arun Mehta', mobile: '9265218085', email: 'admin@smartschool.com', role: 'admin' },
    { name: 'Neha Sharma', mobile: '9876543210', email: 'principal@smartschool.com', role: 'employee' },
    { name: 'Rohit Desai', mobile: '9876543211', email: 'finance@smartschool.com', role: 'admin' },
    { name: 'Priya Patel', mobile: '9876543212', email: 'cashier1@smartschool.com', role: 'cashier' },
    { name: 'Amit Shah', mobile: '9876543213', email: 'cashier2@smartschool.com', role: 'cashier' },
    { name: 'Sneha Joshi', mobile: '9876543214', email: 'cashier3@smartschool.com', role: 'cashier' },
    { name: 'Rakesh Kumar', mobile: '9876543215', email: 'cashier4@smartschool.com', role: 'cashier' },
    { name: 'Deepa Iyer', mobile: '9876543216', email: 'cashier5@smartschool.com', role: 'cashier' },
    { name: 'Mohan Trivedi', mobile: '9876543217', email: 'teacher1@smartschool.com', role: 'employee' },
    { name: 'Anjali Verma', mobile: '9876543218', email: 'teacher2@smartschool.com', role: 'employee' },
    { name: 'Vikram Singh', mobile: '9876543219', email: 'teacher3@smartschool.com', role: 'employee' },
    { name: 'Kavita Nair', mobile: '9876543220', email: 'teacher4@smartschool.com', role: 'employee' },
    { name: 'Rajesh Pandey', mobile: '9876543221', email: 'teacher5@smartschool.com', role: 'employee' },
    { name: 'Meena Reddy', mobile: '9876543222', email: 'teacher6@smartschool.com', role: 'employee' },
    { name: 'Suresh Yadav', mobile: '9876543223', email: 'teacher7@smartschool.com', role: 'employee' },
    { name: 'Pooja Saxena', mobile: '9876543224', email: 'teacher8@smartschool.com', role: 'employee' },
    { name: 'Dinesh Gupta', mobile: '9876543225', email: 'teacher9@smartschool.com', role: 'employee' },
    { name: 'Rekha Deshmukh', mobile: '9876543226', email: 'teacher10@smartschool.com', role: 'employee' },
    { name: 'Anil Kulkarni', mobile: '9876543227', email: 'teacher11@smartschool.com', role: 'employee' },
    { name: 'Sunita Chavan', mobile: '9876543228', email: 'teacher12@smartschool.com', role: 'employee' },
    { name: 'Prakash Joshi', mobile: '9876543229', email: 'teacher13@smartschool.com', role: 'employee' },
    { name: 'Nandini Rao', mobile: '9876543230', email: 'teacher14@smartschool.com', role: 'employee' },
    { name: 'Manish Thakur', mobile: '9876543231', email: 'teacher15@smartschool.com', role: 'employee' },
    { name: 'Kiran Jadhav', mobile: '9876543232', email: 'counsellor@smartschool.com', role: 'employee' }
  ];

  const staffGuardians = staffData.map(s => ({
    name: s.name,
    mobile: s.mobile,
    email: s.email,
    passwordHash,
    role: s.role
  }));

  await prisma.guardian.createMany({ data: staffGuardians });
  const created = await prisma.guardian.findMany({
    where: { role: { in: ['admin','cashier','employee'] } },
    orderBy: { id: 'asc' }
  });

  const admin = created.find(g => g.email === 'admin@smartschool.com');
  const principal = created.find(g => g.email === 'principal@smartschool.com');
  const financeAdmin = created.find(g => g.email === 'finance@smartschool.com');
  const cashierGuardians = created.filter(g => g.role === 'cashier');

  const cashierRecords = cashierGuardians.map(cg => ({
    userId: cg.id,
    createdByAdminId: admin.id,
    status: cg.id === cashierGuardians[cashierGuardians.length - 1].id ? 'inactive' : 'active'
  }));

  await prisma.cashier.createMany({ data: cashierRecords });
  const cashiers = await prisma.cashier.findMany({ orderBy: { id: 'asc' } });

  console.log(`Created ${created.length} staff accounts, ${cashiers.length} cashier records`);
  return { admin, principal, financeAdmin, cashierGuardians, cashiers, allStaff: created };
}

module.exports = { seedUsers };
