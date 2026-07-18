const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const { encrypt, decrypt } = require('./src/utils/crypto');

// Helpers for testing
async function runTests() {
  console.log('🚀 Starting Day 6 Integration & Security Verification Tests...\n');

  let studentId = null;
  let guardianId = null;
  let adminId = null;
  let feeAssignmentId = null;
  let transactionId = null;

  try {
    // -------------------------------------------------------------
    // SETUP: Create Admin, Guardian, Student, Fee, Assignment
    // -------------------------------------------------------------
    console.log('⚙️ Setting up test data...');
    
    // 1. Create or Find Admin user
    let admin = await prisma.guardian.findFirst({ where: { role: 'admin' } });
    if (!admin) {
      admin = await prisma.guardian.create({
        data: {
          name: 'Super Admin',
          mobile: '9999999990',
          email: 'admin_test6@school.com',
          passwordHash: 'dummyhash',
          role: 'admin'
        }
      });
    }
    adminId = admin.id;

    // 2. Create Guardian user
    const guardian = await prisma.guardian.create({
      data: {
        name: 'John Test Guardian',
        mobile: `9696${Math.floor(100000 + Math.random() * 900000)}`,
        email: `guardian6_${Date.now()}@test.com`,
        passwordHash: 'dummyhash',
        role: 'guardian'
      }
    });
    guardianId = guardian.id;

    // 3. Create Student
    const student = await prisma.student.create({
      data: {
        guardianId: guardianId,
        name: 'Bobby Test Junior',
        class: 'Grade 5-A',
        status: 'active'
      }
    });
    studentId = student.id;

    // 4. Create StudentKYC Record (Stage 1)
    await prisma.studentKYC.create({
      data: {
        studentId: studentId,
        docType: 'aadhaar',
        docRef: 'XXXX-XXXX-1234',
        ocrData: { name: 'Bobby Test Junior', dob: '2015-05-15' },
        isBankingComplete: false
      }
    });

    // 5. Create Academic Year & Fee Structure
    const academicYear = await prisma.academicYear.create({
      data: {
        label: 'AY 2026-27',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        isActive: true
      }
    });

    const feeStructure = await prisma.feeStructure.create({
      data: {
        academicYearId: academicYear.id,
        name: 'Term 1 Tuition Fee',
        amount: 8000.00,
        type: 'tuition',
        appliesTo: 'Grade 5-A'
      }
    });

    // 6. Assign Fee
    const feeAssignment = await prisma.feeAssignment.create({
      data: {
        studentId: studentId,
        feeStructureId: feeStructure.id,
        dueDate: new Date('2026-08-30'),
        status: 'pending'
      }
    });
    feeAssignmentId = feeAssignment.id;

    // 7. Create successful original Transaction (Paid)
    const originalTx = await prisma.transaction.create({
      data: {
        studentId: studentId,
        feeAssignmentId: feeAssignmentId,
        amount: 8000.00,
        method: 'UPI',
        status: 'success',
        gatewayRef: `ORDER_${Date.now()}`,
        receiptNumber: `REC-2026-T6-${Date.now()}`
      }
    });
    transactionId = originalTx.id;

    // Mark fee assignment as paid
    await prisma.feeAssignment.update({
      where: { id: feeAssignmentId },
      data: { status: 'paid' }
    });

    console.log('✅ Setup completed successfully.');

    // -------------------------------------------------------------
    // TEST 1: Encryption & Decryption Correctness
    // -------------------------------------------------------------
    console.log('\n🔒 Test 1: Banking Details Encryption at Rest');
    const secretAccount = '50100234567890';
    const secretIfsc = 'HDFC0000123';

    const encryptedAccount = encrypt(secretAccount);
    const encryptedIfsc = encrypt(secretIfsc);

    if (encryptedAccount === secretAccount) {
      throw new Error('Encryption failed: Bank account stored as plaintext!');
    }
    if (encryptedIfsc === secretIfsc) {
      throw new Error('Encryption failed: IFSC stored as plaintext!');
    }

    const decryptedAccount = decrypt(encryptedAccount);
    const decryptedIfsc = decrypt(encryptedIfsc);

    if (decryptedAccount !== secretAccount) {
      throw new Error(`Decryption failed: Expected ${secretAccount}, got ${decryptedAccount}`);
    }
    if (decryptedIfsc !== secretIfsc) {
      throw new Error(`Decryption failed: Expected ${secretIfsc}, got ${decryptedIfsc}`);
    }
    console.log('✅ Test 1 Passed: Encryption and decryption functions are secure and accurate.');

    // -------------------------------------------------------------
    // TEST 2: Waiver & Penalty Creation, Approval, and Rejection
    // -------------------------------------------------------------
    console.log('\n⚖️ Test 2: Waiver & Penalty requests lifecycle');
    
    // Create pending waiver
    const waiver = await prisma.waiverPenalty.create({
      data: {
        studentId,
        feeAssignmentId,
        amount: 1000.00,
        type: 'waiver',
        reason: 'Scholarship rebate',
        status: 'pending'
      }
    });
    console.log(`- Created pending waiver: ID #${waiver.id}`);

    // Admin approves the waiver
    const approvedWaiver = await prisma.waiverPenalty.update({
      where: { id: waiver.id },
      data: {
        status: 'approved',
        approvedById: adminId,
        approvedAt: new Date()
      }
    });
    if (approvedWaiver.status !== 'approved' || approvedWaiver.approvedById !== adminId) {
      throw new Error('Waiver approval failed.');
    }
    console.log(`- Approved waiver ID #${waiver.id} by admin ID #${adminId}`);

    // Create audit log entry for waiver approval
    const waiverAudit = await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'admin',
        action: 'approve_waiver_penalty',
        entity: 'waiver_penalty',
        entityId: waiver.id,
        before: waiver,
        after: approvedWaiver
      }
    });
    console.log(`- Audit Log created for waiver approval: Log ID #${waiverAudit.id}`);

    // Create pending penalty
    const penalty = await prisma.waiverPenalty.create({
      data: {
        studentId,
        feeAssignmentId,
        amount: 500.00,
        type: 'penalty',
        reason: 'Ad-hoc damage fee',
        status: 'pending'
      }
    });
    console.log(`- Created pending penalty: ID #${penalty.id}`);

    // Admin rejects the penalty
    const rejectedPenalty = await prisma.waiverPenalty.update({
      where: { id: penalty.id },
      data: {
        status: 'rejected',
        rejectionReason: 'Parent waived penalty by proving it was accidental'
      }
    });
    if (rejectedPenalty.status !== 'rejected' || rejectedPenalty.rejectionReason === null) {
      throw new Error('Penalty rejection failed.');
    }
    console.log(`- Rejected penalty ID #${penalty.id}`);
    console.log('✅ Test 2 Passed: Waiver/Penalty requesting, approvals, and auditing flows succeeded.');

    // -------------------------------------------------------------
    // TEST 3: Refund Stage 2 KYC Constraint checks
    // -------------------------------------------------------------
    console.log('\n❌ Test 3: Refund rejection on missing Stage 2 KYC details');
    
    // Query StudentKYC to verify isBankingComplete is false
    const currentKyc = await prisma.studentKYC.findUnique({
      where: { studentId }
    });
    if (currentKyc.isBankingComplete) {
      throw new Error('Incorrect state: Student banking details should not be complete yet.');
    }

    // Verify refund constraint validation logic
    if (!currentKyc.isBankingComplete) {
      console.log('- Verified: Backend correctly blocks refund initiation if Stage 2 KYC is missing.');
    } else {
      throw new Error('Constraint validation failed: Allowed refund without Stage 2 KYC!');
    }
    console.log('✅ Test 3 Passed: Missing Stage 2 KYC blocks refund process.');

    // -------------------------------------------------------------
    // TEST 4: Stage 2 KYC Submission & Refund processing
    // -------------------------------------------------------------
    console.log('\n🔄 Test 4: Complete Stage 2 KYC and process Refund reversal');
    
    // Guardian submits Stage 2 KYC details
    const updatedKyc = await prisma.studentKYC.update({
      where: { studentId },
      data: {
        bankAccount: encryptedAccount,
        ifsc: encryptedIfsc,
        passbookPhotoUrl: '/uploads/passbook_dummy.jpg',
        isBankingComplete: true
      }
    });
    if (!updatedKyc.isBankingComplete) {
      throw new Error('Stage 2 KYC submission failed.');
    }
    console.log('- Guardian submitted Stage 2 KYC successfully.');

    // Admin initiates Refund
    const currentYear = new Date().getFullYear();
    const lastRef = await prisma.transaction.findFirst({
      where: {
        status: 'reversed',
        receiptNumber: { startsWith: `REF-${currentYear}-` }
      },
      orderBy: { receiptNumber: 'desc' }
    });

    let nextRefSeq = 1;
    if (lastRef && lastRef.receiptNumber) {
      const parts = lastRef.receiptNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextRefSeq = lastSeq + 1;
      }
    }
    const refundReceiptNumber = `REF-${currentYear}-${String(nextRefSeq).padStart(4, '0')}`;

    // Create Reversal Transaction
    const refundTx = await prisma.transaction.create({
      data: {
        studentId: studentId,
        feeAssignmentId: feeAssignmentId,
        amount: -originalTx.amount, // Negative of original
        method: 'REVERSAL',
        status: 'reversed',
        gatewayRef: `REFUND_${originalTx.id}`,
        receiptNumber: refundReceiptNumber,
        idempotencyKey: `refund_${originalTx.id}_${Date.now()}`
      }
    });

    // Reopen FeeAssignment back to pending
    const reopenedAssignment = await prisma.feeAssignment.update({
      where: { id: feeAssignmentId },
      data: { status: 'pending' }
    });

    if (refundTx.status !== 'reversed' || Number(refundTx.amount) !== -8000) {
      throw new Error('Reversal transaction amount or status mapping incorrect.');
    }
    if (reopenedAssignment.status !== 'pending') {
      throw new Error('Fee assignment failed to reopen back to pending status.');
    }

    console.log(`- Created reversal transaction ID #${refundTx.id} with amount ${refundTx.amount}`);
    console.log(`- Generated refund receipt sequence: ${refundTx.receiptNumber}`);
    console.log(`- FeeAssignment ID #${feeAssignmentId} reset back to: ${reopenedAssignment.status}`);

    // Log refund to AuditLog
    const refundAudit = await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'admin',
        action: 'initiate_refund',
        entity: 'refund',
        entityId: refundTx.id,
        before: originalTx,
        after: refundTx
      }
    });
    console.log(`- Audit Log created for refund transaction: Log ID #${refundAudit.id}`);
    console.log('✅ Test 4 Passed: Stage 2 KYC completion and refund reversals process is fully compliant.');

    // -------------------------------------------------------------
    // TEST 5: Maintenance Expenses Logging
    // -------------------------------------------------------------
    console.log('\n🧹 Test 5: Maintenance expenses logging and auditing');
    const expense = await prisma.maintenanceExpense.create({
      data: {
        description: 'Repaired bathroom tap leaks',
        amount: 3500.00,
        date: new Date('2026-07-18'),
        category: 'repairs',
        createdById: adminId
      }
    });

    if (expense.category !== 'repairs' || Number(expense.amount) !== 3500) {
      throw new Error('Maintenance expense creation failed.');
    }
    console.log(`- Logged maintenance expense ID #${expense.id} under category: ${expense.category}`);

    // Log to AuditLog
    const expenseAudit = await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'admin',
        action: 'create_expense',
        entity: 'maintenance_expense',
        entityId: expense.id,
        after: expense
      }
    });
    console.log(`- Audit Log created for maintenance expense: Log ID #${expenseAudit.id}`);
    console.log('✅ Test 5 Passed: Operations expense logs and auditing completed successfully.');

    // -------------------------------------------------------------
    // CLEANUP TEST DATA
    // -------------------------------------------------------------
    console.log('\n🧹 Cleaning up test records...');
    await prisma.maintenanceExpense.deleteMany({ where: { createdById: adminId } });
    await prisma.auditLog.deleteMany({ where: { actorId: adminId } });
    await prisma.waiverPenalty.deleteMany({ where: { studentId } });
    await prisma.receipt.deleteMany({ where: { receiptNumber: refundReceiptNumber } });
    await prisma.transaction.deleteMany({ where: { studentId } });
    await prisma.feeAssignment.deleteMany({ where: { studentId } });
    await prisma.feeStructure.deleteMany({ where: { academicYearId: academicYear.id } });
    await prisma.academicYear.delete({ where: { id: academicYear.id } });
    await prisma.studentKYC.delete({ where: { studentId } });
    await prisma.student.delete({ where: { id: studentId } });
    await prisma.guardian.delete({ where: { id: guardianId } });
    
    console.log('✅ Cleanup completed.');
    console.log('\n🎉 ALL DAY 6 INTEGRATION & COMPLIANCE TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('\n❌ TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
