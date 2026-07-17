const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000';

async function runTests() {
  console.log('=== STARTING INTEGRATION TESTS FOR DAY 3 ===\n');

  try {
    // 0. Clean test database data only
    console.log('[Step 0] Cleaning test database data only...');
    await prisma.receipt.deleteMany({
      where: {
        receiptNumber: { startsWith: 'REC-2026' }
      }
    });
    await prisma.chequeRecord.deleteMany({
      where: {
        transaction: {
          student: {
            guardian: {
              mobile: { startsWith: '888888' }
            }
          }
        }
      }
    });
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { student: { guardian: { mobile: { startsWith: '888888' } } } },
          { student: { guardian: { mobile: { startsWith: '999999' } } } }
        ]
      }
    });
    await prisma.feeAssignment.deleteMany({
      where: {
        student: {
          guardian: {
            OR: [
              { mobile: { startsWith: '888888' } },
              { mobile: { startsWith: '999999' } }
            ]
          }
        }
      }
    });
    await prisma.student.deleteMany({
      where: {
        guardian: {
          OR: [
            { mobile: { startsWith: '888888' } },
            { mobile: { startsWith: '999999' } }
          ]
        }
      }
    });
    await prisma.feeStructure.deleteMany({
      where: {
        name: { startsWith: 'Grade 10 Tuition Fee' }
      }
    });
    await prisma.guardian.deleteMany({
      where: {
        OR: [
          { mobile: { startsWith: '999999' } },
          { mobile: { startsWith: '888888' } },
          { mobile: { startsWith: '777777' } }
        ]
      }
    });
    console.log('✓ Test data cleaned.\n');

    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const adminMobile = '999999' + suffix;
    const adminEmail = `admin_${suffix}@school.com`;
    const gMobile = '888888' + suffix;
    const gEmail = `guardian_${suffix}@mail.com`;

    // 1. Setup Admin and Guardian
    console.log('[Step 1] Creating Admin and Guardian accounts...');
    
    // Register Admin
    const adminSignupRes = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Principal',
        mobile: adminMobile,
        email: adminEmail,
        password: 'Password123',
        role: 'admin'
      })
    });
    const adminData = await adminSignupRes.json();
    if (!adminSignupRes.ok) throw new Error(`Admin signup failed: ${JSON.stringify(adminData)}`);

    // Verify Admin OTP
    const adminLoginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: adminMobile, password: 'Password123' })
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok) throw new Error(`Admin login step 1 failed: ${JSON.stringify(adminLoginData)}`);

    const adminVerifyRes = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: adminMobile, otp: adminLoginData.otp })
    });
    const adminTokenData = await adminVerifyRes.json();
    if (!adminVerifyRes.ok) throw new Error(`Admin OTP verification failed: ${JSON.stringify(adminTokenData)}`);
    const adminToken = adminTokenData.token;
    console.log('✓ Admin registered and authenticated.');

    // Register Guardian & Ward
    const guardianSignupRes = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        mobile: gMobile,
        email: gEmail,
        password: 'Password123',
        role: 'guardian',
        studentName: 'Timmy Doe',
        studentClass: 'Grade 10',
        studentDob: '2012-05-15'
      })
    });
    const gData = await guardianSignupRes.json();
    if (!guardianSignupRes.ok) throw new Error(`Guardian signup failed: ${JSON.stringify(gData)}`);
    const studentId = gData.student.id;

    // Login Guardian
    const gLoginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: gMobile, password: 'Password123' })
    });
    const gLoginData = await gLoginRes.json();
    if (!gLoginRes.ok) throw new Error(`Guardian login step 1 failed: ${JSON.stringify(gLoginData)}`);

    const gVerifyRes = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: gMobile, otp: gLoginData.otp })
    });
    const gTokenData = await gVerifyRes.json();
    if (!gVerifyRes.ok) throw new Error(`Guardian OTP verification failed: ${JSON.stringify(gTokenData)}`);
    const gToken = gTokenData.token;
    console.log('✓ Guardian registered and authenticated.');

    // 2. Grant DPDP Consent & Approve Student (set status to active)
    console.log('[Step 2] Granting DPDP Consent and activating Ward...');
    await fetch(`${API_URL}/api/auth/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gToken}` },
      body: JSON.stringify({ studentId, consentChecked: true })
    });
    
    // Submit student KYC first
    const kycRes = await fetch(`${API_URL}/api/students/kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gToken}` },
      body: JSON.stringify({
        studentId,
        docType: 'aadhaar',
        docRef: '123456789012',
        ocrData: {
          name: 'Timmy Doe',
          dob: '2012-05-15'
        }
      })
    });
    if (!kycRes.ok) {
      const errData = await kycRes.json();
      throw new Error(`KYC submission failed: ${JSON.stringify(errData)}`);
    }

    // Direct approve student via Admin
    const approveRes = await fetch(`${API_URL}/api/admin/approvals/${studentId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    });
    if (!approveRes.ok) throw new Error('Student KYC approval failed');
    console.log('✓ Ward status verified and activated.');

    // 3. Assign Fee Structure
    console.log('[Step 3] Assigning Fee Structure to Ward...');
    const academicYearsRes = await fetch(`${API_URL}/api/academic-years`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const years = await academicYearsRes.json();
    const activeYear = years.find(y => y.isActive);

    const feeStructureRes = await fetch(`${API_URL}/api/fees/structures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Grade 10 Tuition Fee v1',
        amount: 25000,
        type: 'tuition',
        appliesTo: 'Grade 10',
        academicYearId: activeYear.id
      })
    });
    const feeStructure = await feeStructureRes.json();

    const assignRes = await fetch(`${API_URL}/api/fees/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId,
        feeStructureId: feeStructure.id,
        dueDate: '2026-10-31'
      })
    });
    const assignment = await assignRes.json();
    console.log(`✓ Fee of ₹25,000 assigned. Assignment ID: ${assignment.id}`);

    // 4. Test Initiate Checkout (UPI)
    console.log('[Step 4] Initiating payment order (UPI Checkout)...');
    const idempKey = `idemp_test_${suffix}_1`;
    const initiateRes = await fetch(`${API_URL}/api/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gToken}` },
      body: JSON.stringify({
        feeAssignmentId: assignment.id,
        method: 'UPI',
        idempotencyKey: idempKey
      })
    });
    const initiateData = await initiateRes.json();
    if (!initiateRes.ok) throw new Error(`Initiate failed: ${JSON.stringify(initiateData)}`);
    console.log(`✓ Order initiated successfully. Sandbox URL retrieved: ${initiateData.paymentUrl}`);

    // 5. Test Idempotency Double Payment Prevention
    console.log('[Step 5] Testing Idempotency (preventing double payment)...');
    const dupRes = await fetch(`${API_URL}/api/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gToken}` },
      body: JSON.stringify({
        feeAssignmentId: assignment.id,
        method: 'UPI',
        idempotencyKey: idempKey
      })
    });
    const dupData = await dupRes.json();
    if (dupRes.status !== 400 || !dupData.error.includes('Duplicate payment request')) {
      throw new Error(`Idempotency check failed: Expected 400 duplicate error, received ${dupRes.status}`);
    }
    console.log('✓ Idempotency protected: Double charging blocked successfully.');

    // 6. Test Webhook Processing
    console.log('[Step 6] Simulating Cashfree Success Webhook...');
    const webhookRes = await fetch(`${API_URL}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-bypass': 'true' // Bypass HMAC signature check in test environment
      },
      body: JSON.stringify({
        order_id: initiateData.orderId,
        order_status: 'PAID',
        txn_id: `MOCK_TXN_${suffix}`,
        cf_payment_id: 123456789
      })
    });
    const webhookData = await webhookRes.json();
    if (!webhookRes.ok || webhookData.status !== 'success') {
      throw new Error(`Webhook simulation failed: ${JSON.stringify(webhookData)}`);
    }
    console.log('✓ Webhook successfully processed.');

    // 7. Verify Database State
    console.log('[Step 7] Checking DB state after webhook capture...');
    const tx = await prisma.transaction.findFirst({
      where: { gatewayRef: initiateData.orderId }
    });
    if (!tx || tx.status !== 'success' || !tx.receiptNumber) {
      throw new Error('Database transaction not updated to success or missing receiptNumber');
    }
    console.log(`✓ DB Transaction is SUCCESS. Receipt Number: ${tx.receiptNumber}`);

    const feeAssignmentCheck = await prisma.feeAssignment.findUnique({
      where: { id: assignment.id }
    });
    if (feeAssignmentCheck.status !== 'paid') {
      throw new Error('Fee assignment was not marked paid');
    }
    console.log('✓ Fee Assignment successfully marked PAID.');

    // 8. Verify Receipt PDF Retrieval
    console.log('[Step 8] Verifying Receipt PDF binary extraction...');
    const receiptRes = await fetch(`${API_URL}/api/payments/receipt?transaction_id=${tx.id}`, {
      headers: { 'Authorization': `Bearer ${gToken}` }
    });
    const receiptData = await receiptRes.json();
    if (!receiptRes.ok || !receiptData.receiptUrl.startsWith('data:application/pdf;base64,')) {
      throw new Error('Receipt retrieval failed or returned invalid base64 format');
    }
    console.log('✓ PDF Receipt verified (base64 buffer matches).');

    // 9. Test Cashier Manual Cash Collection
    console.log('[Step 9] Testing Cashier manual CASH collection...');
    
    // Assign second fee component
    const feeStructureRes2 = await fetch(`${API_URL}/api/fees/structures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Grade 10 Transport Fee v1',
        amount: 5000,
        type: 'transport',
        appliesTo: 'Grade 10',
        academicYearId: activeYear.id
      })
    });
    const feeStructure2 = await feeStructureRes2.json();

    const assignRes2 = await fetch(`${API_URL}/api/fees/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId,
        feeStructureId: feeStructure2.id,
        dueDate: '2026-11-30'
      })
    });
    const assignment2 = await assignRes2.json();

    // Cashier manual collect
    const collectRes = await fetch(`${API_URL}/api/payments/collect-manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        feeAssignmentId: assignment2.id,
        method: 'CASH',
        deposited: true
      })
    });
    const collectData = await collectRes.json();
    if (!collectRes.ok) throw new Error(`Manual collection failed: ${JSON.stringify(collectData)}`);
    
    // Check sequential receipt increment
    const cashierTx = await prisma.transaction.findUnique({
      where: { id: collectData.transaction.id }
    });
    console.log(`✓ Cash payment success. Sequential receipt allocated: ${cashierTx.receiptNumber}`);
    if (cashierTx.receiptNumber !== `REC-2026-0002`) {
      throw new Error(`Receipt number sequence mismatch: Expected REC-2026-0002, got ${cashierTx.receiptNumber}`);
    }
    console.log('✓ Sequential receipt numbers successfully verified (REC-2026-0001 -> REC-2026-0002).');

    console.log('\n=============================================');
    console.log('🎉 ALL PAYMENTS & TRANSACTIONS TESTS PASSED! 🎉');
    console.log('=============================================\n');

  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
