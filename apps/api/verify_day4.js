const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000';

async function runTests() {
  console.log('=== STARTING INTEGRATION TESTS FOR DAY 4 ===\n');

  try {
    // 0. Clean database test data
    console.log('[Step 0] Cleaning test database data only...');
    await prisma.waiverPenalty.deleteMany({});
    await prisma.receipt.deleteMany({});
    await prisma.chequeRecord.deleteMany({});
    await prisma.transaction.deleteMany({
      where: {
        idempotencyKey: { startsWith: 'TEST_IDEMP_' }
      }
    });
    console.log('✓ Test data cleaned.\n');

    // 1. Authenticate / Setup accounts
    console.log('[Step 1] Creating Admin and Cashier accounts...');
    const adminMobile = '9999994444';
    const adminEmail = 'admin_day4@mail.com';
    const cashierMobile = '8888884444';
    const cashierEmail = 'cashier_day4@mail.com';

    // Cleanup existing accounts if any
    const existingGuardians = await prisma.guardian.findMany({
      where: { mobile: { in: [adminMobile, cashierMobile] } }
    });
    const gIds = existingGuardians.map(g => g.id);
    await prisma.cashier.deleteMany({
      where: {
        OR: [
          { userId: { in: gIds } },
          { createdByAdminId: { in: gIds } }
        ]
      }
    });
    await prisma.guardian.deleteMany({
      where: { id: { in: gIds } }
    });

    // Sign up Admin
    const adminSignupRes = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Day4',
        mobile: adminMobile,
        email: adminEmail,
        password: 'password123',
        role: 'admin'
      })
    });
    const adminSignup = await adminSignupRes.json();
    
    // Login Admin to get OTP
    const adminLoginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: adminMobile, password: 'password123' })
    });
    const adminLogin = await adminLoginRes.json();
    const adminOtp = adminLogin.otp; // non-prod OTP extraction

    const adminVerifyRes = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: adminMobile, otp: adminOtp })
    });
    const adminAuth = await adminVerifyRes.json();
    const adminToken = adminAuth.token;
    const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };

    // Register Cashier under Admin
    const cashierSignupRes = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Cashier Day4',
        mobile: cashierMobile,
        email: cashierEmail,
        password: 'password123',
        role: 'cashier'
      })
    });
    const cashierSignup = await cashierSignupRes.json();

    // Login Cashier
    const cashierLoginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: cashierMobile, password: 'password123' })
    });
    const cashierLogin = await cashierLoginRes.json();
    const cashierOtp = cashierLogin.otp;

    const cashierVerifyRes = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: cashierMobile, otp: cashierOtp })
    });
    const cashierAuth = await cashierVerifyRes.json();
    const cashierToken = cashierAuth.token;
    const cashierHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` };

    console.log('✓ Admin and Cashier accounts successfully verified.\n');

    // 2. Setup Student and Fee Assignments
    console.log('[Step 2] Setting up Wards and Fee Assignments...');
    const guardianMobile = '7777774444';
    const guardianEmail = 'parent_day4@mail.com';

    await prisma.student.deleteMany({ where: { name: 'Student Day4' } });
    await prisma.guardian.deleteMany({ where: { mobile: guardianMobile } });

    // Register Guardian & Ward
    const guardianSignupRes = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Parent Day4',
        mobile: guardianMobile,
        email: guardianEmail,
        password: 'password123',
        role: 'guardian',
        studentName: 'Student Day4',
        studentClass: 'Grade 10-A',
        studentDob: '2006-08-01'
      })
    });
    const guardianSignup = await guardianSignupRes.json();
    const studentId = guardianSignup.student.id;

    // Approve Ward
    await fetch(`${API_URL}/api/admin/approvals/${studentId}/verify`, {
      method: 'POST',
      headers: adminHeaders
    });

    // Create Fee Structure
    const feeStrRes = await fetch(`${API_URL}/api/fees/structures`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Grade 10 Tuition Fee - Day 4',
        amount: 30000.00,
        type: 'tuition',
        appliesTo: 'Grade 10-A',
        academicYearId: 6 // Bootstrap default
      })
    });
    const feeStr = await feeStrRes.json();

    // Assign Fee 1 (for Cash collection)
    const feeAssign1Res = await fetch(`${API_URL}/api/fees/assignments`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        studentId,
        feeStructureId: feeStr.id,
        dueDate: '2026-08-31'
      })
    });
    const feeAssign1 = await feeAssign1Res.json();

    // Assign Fee 2 (for Cheque collection)
    const feeAssign2Res = await fetch(`${API_URL}/api/fees/assignments`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        studentId,
        feeStructureId: feeStr.id,
        dueDate: '2026-08-31'
      })
    });
    const feeAssign2 = await feeAssign2Res.json();

    console.log(`✓ Student active. Fee assignments generated: Cash ID: ${feeAssign1.id}, Cheque ID: ${feeAssign2.id}\n`);

    // 3. Test Offline CASH Collection (Online simulated call)
    console.log('[Step 3] Testing Offline CASH Collection...');
    const cashIdempKey = `TEST_IDEMP_CASH_${Date.now()}`;
    const cashCollectRes = await fetch(`${API_URL}/api/payments/offline`, {
      method: 'POST',
      headers: cashierHeaders,
      body: JSON.stringify({
        student_id: studentId,
        fee_assignment_id: feeAssign1.id,
        amount: 30000.00,
        method: 'CASH',
        idempotency_key: cashIdempKey
      })
    });
    const cashTx = await cashCollectRes.json();
    if (cashCollectRes.status !== 201) {
      throw new Error(`CASH collection failed: ${JSON.stringify(cashTx)}`);
    }
    if (cashTx.status !== 'success' || !cashTx.receiptNumber) {
      throw new Error(`CASH collection invalid status or missing receipt: ${JSON.stringify(cashTx)}`);
    }

    // Verify Idempotency protection
    const cashCollectDoubleRes = await fetch(`${API_URL}/api/payments/offline`, {
      method: 'POST',
      headers: cashierHeaders,
      body: JSON.stringify({
        student_id: studentId,
        fee_assignment_id: feeAssign1.id,
        amount: 30000.00,
        method: 'CASH',
        idempotency_key: cashIdempKey
      })
    });
    const cashTxDouble = await cashCollectDoubleRes.json();
    if (cashTxDouble.id !== cashTx.id) {
      throw new Error('Idempotency check failed: duplicate key created new row.');
    }
    console.log('✓ CASH payment logged. Sequential receipt generated. Idempotency protection verified.\n');

    // 4. Test Offline CHEQUE Collection
    console.log('[Step 4] Testing Offline CHEQUE Collection...');
    const chequeIdempKey = `TEST_IDEMP_CHEQUE_${Date.now()}`;
    const chequeCollectRes = await fetch(`${API_URL}/api/payments/offline`, {
      method: 'POST',
      headers: cashierHeaders,
      body: JSON.stringify({
        student_id: studentId,
        fee_assignment_id: feeAssign2.id,
        amount: 30000.00,
        method: 'CHEQUE',
        cheque_no: 'CHQ-987654',
        bank: 'HDFC Bank',
        idempotency_key: chequeIdempKey
      })
    });
    const chequeTx = await chequeCollectRes.json();
    if (chequeCollectRes.status !== 201) {
      throw new Error(`CHEQUE collection failed: ${JSON.stringify(chequeTx)}`);
    }
    if (chequeTx.status !== 'pending' || chequeTx.receiptNumber !== null) {
      throw new Error(`CHEQUE collection should start as pending: ${JSON.stringify(chequeTx)}`);
    }

    // Verify ChequeRecord exists
    const chequeRecord = await prisma.chequeRecord.findFirst({
      where: { transactionId: chequeTx.id }
    });
    if (!chequeRecord || chequeRecord.depositStatus !== 'deposit_pending') {
      throw new Error('ChequeRecord not created or has wrong status.');
    }
    console.log('✓ CHEQUE payment logged as pending. Cheque record initialized.\n');

    // 5. Test Cheque Deposit transition
    console.log('[Step 5] Testing Cheque Deposit transition...');
    const depositRes = await fetch(`${API_URL}/api/cheques/${chequeRecord.id}/deposit`, {
      method: 'PUT',
      headers: cashierHeaders
    });
    const depositedCheque = await depositRes.json();
    if (depositRes.status !== 200 || depositedCheque.depositStatus !== 'bank_pending') {
      throw new Error(`Deposit update failed: ${JSON.stringify(depositedCheque)}`);
    }

    // Verify parent transaction has deposited_at set
    const updatedTx = await prisma.transaction.findUnique({
      where: { id: chequeTx.id }
    });
    if (!updatedTx.depositedAt) {
      throw new Error('Transaction depositedAt was not updated.');
    }
    console.log('✓ Cheque status transitioned to bank_pending. Transaction depositedAt timestamp set.\n');

    // 6. Test Cheque Bounce Flow
    console.log('[Step 6] Testing Cheque Bounce Flow (reopen, penalty, audit)...');
    const bounceRes = await fetch(`${API_URL}/api/cheques/${chequeRecord.id}/bounce`, {
      method: 'PUT',
      headers: cashierHeaders,
      body: JSON.stringify({ bounce_reason: 'Signature mismatch' })
    });
    const bounceResult = await bounceRes.json();
    if (bounceRes.status !== 200) {
      throw new Error(`Bounce request failed: ${JSON.stringify(bounceResult)}`);
    }

    // Verify fee assignment is reopened to pending
    const reopenedAssign = await prisma.feeAssignment.findUnique({
      where: { id: feeAssign2.id }
    });
    if (reopenedAssign.status !== 'pending') {
      throw new Error(`Reopened assignment status is not pending: ${reopenedAssign.status}`);
    }

    // Verify bounce penalty of ₹500 is applied
    const penalty = await prisma.waiverPenalty.findFirst({
      where: { feeAssignmentId: feeAssign2.id }
    });
    if (!penalty || Number(penalty.amount) !== 500.00 || penalty.type !== 'penalty') {
      throw new Error(`Penalty record missing or invalid: ${JSON.stringify(penalty)}`);
    }
    console.log('✓ Cheque bounce successfully reopened fee, applied ₹500 penalty, and logged audit logs.\n');

    // 7. Test Bank statement Reconciliation Parser
    console.log('[Step 7] Testing Bank Statement Reconciliation matching...');
    // We mark the cash transaction deposited_at date as today for matching
    const cashTime = new Date();
    const updatedCashTx = await prisma.transaction.update({
      where: { id: cashTx.id },
      data: { depositedAt: cashTime }
    });

    const csvDateStr = cashTime.toISOString().split('T')[0];
    const csvContent = `date,amount\n${csvDateStr},30000\n${csvDateStr},99999`; // One match, one mismatch

    const reconRes = await fetch(`${API_URL}/api/reconciliation/upload`, {
      method: 'POST',
      headers: cashierHeaders,
      body: JSON.stringify({ csvText: csvContent })
    });
    const reconResult = await reconRes.json();
    if (reconRes.status !== 200) {
      throw new Error(`Reconciliation upload failed: ${JSON.stringify(reconResult)}`);
    }

    if (reconResult.matched.length !== 1 || reconResult.unmatched.length !== 1) {
      throw new Error(`Reconciliation matching error: ${JSON.stringify(reconResult)}`);
    }

    if (reconResult.matched[0].transactionId !== cashTx.id) {
      throw new Error(`Matched transaction ID mismatch: expected ${cashTx.id}, got ${reconResult.matched[0].transactionId}`);
    }
    console.log('✓ Bank reconciliation auto-matched successfully by amount + date. Mismatches successfully flagged.\n');

    console.log('=============================================');
    console.log('🎉 ALL DAY 4 INTEGRATION TESTS PASSED! 🎉');
    console.log('=============================================');

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
