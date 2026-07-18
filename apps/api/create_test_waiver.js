const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createWaiver() {
  try {
    // Find any student
    const student = await prisma.student.findFirst();
    if (!student) {
      console.log('❌ No students found in the database. Please register a student or run verify_day6.js first.');
      process.exit(0);
    }

    // Find any pending fee assignment
    let assignment = await prisma.feeAssignment.findFirst({
      where: { studentId: student.id }
    });

    if (!assignment) {
      // Create a dummy assignment if none exists
      let ay = await prisma.academicYear.findFirst();
      if (!ay) {
        ay = await prisma.academicYear.create({
          data: {
            label: 'AY 2026-27',
            startDate: new Date('2026-06-01'),
            endDate: new Date('2027-04-30'),
            isActive: true
          }
        });
      }
      let fs = await prisma.feeStructure.findFirst();
      if (!fs) {
        fs = await prisma.feeStructure.create({
          data: {
            academicYearId: ay.id,
            name: 'Tuition Fee Extra',
            amount: 5000.00,
            type: 'tuition',
            appliesTo: 'all'
          }
        });
      }
      assignment = await prisma.feeAssignment.create({
        data: {
          studentId: student.id,
          feeStructureId: fs.id,
          dueDate: new Date('2026-09-30'),
          status: 'pending'
        }
      });
    }

    // Create a pending waiver
    const waiver = await prisma.waiverPenalty.create({
      data: {
        studentId: student.id,
        feeAssignmentId: assignment.id,
        amount: 750.00,
        type: 'waiver',
        reason: 'Manual Covid-19 Relief Rebate',
        status: 'pending'
      }
    });

    console.log('\n==================================================');
    console.log('✅ SUCCESS: Pending Waiver Created!');
    console.log(`- Student: ${student.name}`);
    console.log(`- Waiver Amount: ₹750.00`);
    console.log(`- Reason: ${waiver.reason}`);
    console.log('==================================================\n');
    console.log('You can now log in as Admin and navigate to:');
    console.log('Pending Approvals -> Waiver & Penalty Requests tab to see this waiver.');

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

createWaiver();
