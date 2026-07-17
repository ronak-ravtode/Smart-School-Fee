require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000';

async function runTests() {
  console.log('=== STARTING INTEGRATION TESTS FOR DAY 1 ===\n');

  // 0. Clean database for a repeatable test run (isolated test data only)
  console.log('[Step 0] Cleaning test database data only...');
  await prisma.student.deleteMany({
    where: {
      guardian: {
        mobile: { startsWith: '888888' }
      }
    }
  });
  await prisma.cashier.deleteMany({
    where: {
      user: {
        mobile: { startsWith: '777777' }
      }
    }
  });
  await prisma.guardian.deleteMany({
    where: {
      mobile: {
        in: [
          '999999', '888888', '777777'
        ]
      }
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
  const guardianMobile = '888888' + suffix;
  const cashierMobile = '777777' + suffix;

  // 1. Signup testing
  console.log('[Step 1] Testing Signup endpoints...');
  
  // Register Admin
  const adminSignupRes = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'School Principal',
      email: 'admin@school.com',
      mobile: adminMobile,
      password: 'adminpassword',
      role: 'admin'
    })
  });
  const adminSignup = await adminSignupRes.json();
  if (adminSignupRes.status !== 201) {
    throw new Error(`Admin signup failed: ${JSON.stringify(adminSignup)}`);
  }
  console.log('✓ Admin Signup succeeded.');

  // Register Guardian
  const guardianSignupRes = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'John Doe',
      email: 'parent@home.com',
      mobile: guardianMobile,
      password: 'parentpassword',
      role: 'guardian'
    })
  });
  const guardianSignup = await guardianSignupRes.json();
  if (guardianSignupRes.status !== 201) {
    throw new Error(`Guardian signup failed: ${JSON.stringify(guardianSignup)}`);
  }
  console.log('✓ Guardian Signup succeeded.');

  // Verify Audit Log entry created for Signup
  const auditLogs = await prisma.auditLog.findMany({
    where: { action: 'signup' }
  });
  if (auditLogs.length < 2) {
    throw new Error('Audit logs were not created for signups!');
  }
  console.log(`✓ Audit log verified: created ${auditLogs.length} logs for signup.\n`);

  // 2. Lockout testing
  console.log('[Step 2] Testing login rate limiting and lockout...');
  for (let i = 1; i <= 5; i++) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: guardianMobile, password: 'wrongpassword' })
    });
    const body = await res.json();
    if (i === 5) {
      if (res.status !== 423) {
        throw new Error(`Expected lockout on 5th attempt (423), got ${res.status}: ${JSON.stringify(body)}`);
      }
      console.log('✓ Got 423 Locked on the 5th failed login attempt.');
    } else {
      console.log(`  Failed attempt ${i}: received ${res.status} (${body.error})`);
    }
  }
  console.log('✓ Account lockout verified.\n');

  // 3. 2FA OTP Login flow
  console.log('[Step 3] Testing 2FA OTP Login Flow...');
  
  // Submit password for Admin
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: adminMobile, password: 'adminpassword' })
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200) {
    throw new Error(`Admin login step 1 failed: ${JSON.stringify(loginData)}`);
  }
  console.log('✓ Password correct. OTP sent.');

  // Retrieve the generated OTP from response (exposed in process.env.NODE_ENV === 'test')
  const otpCode = loginData.otp;
  if (!otpCode) {
    throw new Error('Test environment did not return OTP code. Make sure NODE_ENV is set to test.');
  }
  
  const verifyRes = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: adminMobile, otp: otpCode })
  });
  const verifyData = await verifyRes.json();
  if (verifyRes.status !== 200) {
    throw new Error(`OTP Verification failed: ${JSON.stringify(verifyData)}`);
  }
  console.log('✓ OTP Verified successfully.');
  const adminToken = verifyData.token;
  console.log('✓ JWT Token retrieved.\n');

  // Register a new guardian to test RBAC (avoiding the locked mobile number)
  console.log('[Step 4] Bootstrapping a non-locked Guardian for RBAC testing...');
  const newGuardianRes = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Jane Doe',
      email: 'parent2@home.com',
      mobile: '8888888889',
      password: 'parentpassword2',
      role: 'guardian'
    })
  });
  const newGuardian = await newGuardianRes.json();
  const guardianToken = newGuardian.token;
  console.log('✓ New Guardian registered and token retrieved.\n');

  // 4. RBAC Verification
  console.log('[Step 5] Testing Role-Based Access Control (RBAC)...');
  
  // A. Access Admin Dashboard with Guardian Token (Should be Forbidden 403)
  const gDashboardRes = await fetch(`${API_URL}/api/admin/dashboard`, {
    headers: { 'Authorization': `Bearer ${guardianToken}` }
  });
  if (gDashboardRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for Guardian on Admin dashboard, got: ${gDashboardRes.status}`);
  }
  console.log('✓ Guardian was successfully blocked (403 Forbidden) from Admin route.');

  // B. Access Admin Dashboard with Admin Token (Should succeed)
  const aDashboardRes = await fetch(`${API_URL}/api/admin/dashboard`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (aDashboardRes.status !== 200) {
    throw new Error(`Expected 200 OK for Admin on Admin dashboard, got: ${aDashboardRes.status}`);
  }
  console.log('✓ Admin successfully accessed Admin route.');

  // C. Admin creates a Cashier
  const createCashierRes = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Cashier Emily',
      email: 'cashier@school.com',
      mobile: cashierMobile,
      password: 'cashierpassword',
      role: 'cashier'
    })
  });
  const cashierData = await createCashierRes.json();
  if (createCashierRes.status !== 201) {
    throw new Error(`Admin failed to create cashier: ${JSON.stringify(cashierData)}`);
  }
  console.log('✓ Admin successfully registered a Cashier account.\n');

  // 5. DPDP Consent testing
  console.log('[Step 6] Testing DPDP Compliance Minor Consent...');
  
  // Insert a test student linked to the guardian
  const testStudent = await prisma.student.create({
    data: {
      guardianId: newGuardian.user.id,
      name: 'Timmy Doe',
      class: 'Kindergarten',
      status: 'pending'
    }
  });
  console.log(`✓ Inserted test student ${testStudent.name} (ID: ${testStudent.id})`);

  // Guardian submits consent
  const consentRes = await fetch(`${API_URL}/api/auth/consent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guardianToken}`
    },
    body: JSON.stringify({
      studentId: testStudent.id,
      consent: true
    })
  });
  const consentData = await consentRes.json();
  if (consentRes.status !== 200) {
    throw new Error(`Consent submission failed: ${JSON.stringify(consentData)}`);
  }
  console.log('✓ Consent submitted successfully.');

  // Fetch student from DB and check timestamps
  const updatedStudent = await prisma.student.findUnique({
    where: { id: testStudent.id }
  });
  if (!updatedStudent.consentChecked || !updatedStudent.consentTimestamp) {
    throw new Error('DPDP consent was not recorded correctly on student record!');
  }
  console.log(`✓ DB verified: consentChecked = ${updatedStudent.consentChecked}, consentTimestamp = ${updatedStudent.consentTimestamp}, status = ${updatedStudent.status}`);

  console.log('\n=============================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
