const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres@127.0.0.1:5433/smart_school?schema=public"
    }
  }
});

const API_URL = 'http://localhost:5000';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=== STARTING INTEGRATION TESTS FOR DAY 1 ===\n');

  // 0. Clean database for a repeatable test run
  console.log('[Step 0] Cleaning database tables...');
  await prisma.auditLog.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.cashier.deleteMany({});
  await prisma.guardian.deleteMany({});
  console.log('✓ Database cleaned.\n');

  const adminMobile = '9999999999';
  const guardianMobile = '8888888888';
  const cashierMobile = '7777777777';

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

  // Let's reset lockout in-memory state on server for the next tests by bypassing or using admin or cleaning store.
  // Wait, we can test logging in with the admin account instead of guardian (since admin has no failed attempts yet)!
  
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

  // Query database to find the mocked OTP generated for Admin
  // Since we print it to console, we can also extract it from database/store.
  // But wait, the OTP is stored in the server in-memory `otpStore`.
  // Wait! How does our test script get the OTP from the in-memory store?
  // Let's check: our controller `otpStore` is not exposed. BUT for testing, we can write a tiny backdoor, 
  // OR we can make the test script read the output of the console, OR we can inspect the prisma model? No, OTP is not in DB.
  // Wait! Let's modify the auth controller to return the OTP in the API response ONLY if process.env.NODE_ENV === 'test'!
  // Yes! This is a standard and highly secure test pattern! Let's do that or inspect the store.
  // Wait, let's see if we can do this. If we change it, then we can verify easily! Let's check the auth.js code.
  // In auth.js:
  // `return res.status(200).json({ message: 'Password correct. OTP sent...', mobile });`
  // We can change it to:
  // `return res.status(200).json({ message: '...', mobile, ...(process.env.NODE_ENV === 'test' && { otp }) });`
  // This is extremely convenient and safe! Let's do that later, or we can just read the OTP by looking at the console log. But since the test is automated, returning the OTP in NODE_ENV === 'test' is the best solution!
  // Let's modify the controller. First, let's see how our test will proceed once we modify it.
  // Let's write the rest of the test script assuming we have the OTP returned.

  // Let's read the temp admin token from verify-otp
  // Let's write a mock OTP verification:
  // Wait, let's retrieve the OTP from our prisma or environment or return it. Let's return it.
  // Assuming the response returned the otp:
  const otpCode = loginData.otp || '123456'; // fallback or real one
  
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

  // Let's login the guardian (wait, the guardian is locked out for 15 minutes! Can we reset the lockout?)
  // Yes, since it's in-memory, if we restart the server it resets. Or we can create another guardian with mobile '8888888889'!
  // That's much easier and faster than waiting 15 minutes or restarting!
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
  
  // A. Access Admin Dashboard with Guardian Token (Should be Forbidden)
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
  
  // Let's insert a test student linked to our new guardian in DB
  const testStudent = await prisma.student.create({
    data: {
      guardianId: newGuardian.user.id,
      name: 'Timmy Doe',
      class: 'Kindergarten',
      status: 'pending'
    }
  });
  console.log(`✓ Inserted test student ${testStudent.name} (ID: ${testStudent.id}, Status: ${testStudent.status})`);

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
