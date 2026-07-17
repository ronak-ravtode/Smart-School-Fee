const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('=== STARTING INTEGRATION TESTS FOR DAY 2 ===\n');

  try {
    // 0. Clean database for a repeatable test run (isolated test data only)
    console.log('[Step 0] Cleaning test database data only...');
    await prisma.studentKYC.deleteMany({
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
    await prisma.cashier.deleteMany({
      where: {
        user: {
          OR: [
            { mobile: { startsWith: '777777' } },
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

    // 1. Setup Admin Account
    console.log('[Step 1] Creating Admin account...');
    const adminSignupRes = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'School Principal',
        mobile: adminMobile,
        email: adminEmail,
        password: 'adminpassword',
        role: 'admin'
      })
    });
    const adminSignup = await adminSignupRes.json();
    if (adminSignupRes.status !== 201) {
      throw new Error(`Admin signup failed: ${JSON.stringify(adminSignup)}`);
    }
    const adminToken = adminSignup.token;
    const adminHeaders = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}` 
    };
    console.log('✓ Admin registered and authenticated.\n');

    // 2. Test Academic Year Bootstrapping
    console.log('[Step 2] Testing Academic Year Bootstrapping...');
    const yearsRes = await fetch(`${API_URL}/api/academic-years`, {
      method: 'GET',
      headers: adminHeaders
    });
    const academicYears = await yearsRes.json();
    if (yearsRes.status !== 200 || academicYears.length === 0 || academicYears[0].label !== '2026-27') {
      throw new Error(`Academic year was not bootstrapped automatically: ${JSON.stringify(academicYears)}`);
    }
    const yearId = academicYears[0].id;
    console.log(`✓ Bootstrapped academic year found: ${academicYears[0].label} (ID: ${yearId})\n`);

    // 3. Test Fee Structure Creation
    console.log('[Step 3] Testing Fee Structure Creation...');
    const feeCreateRes = await fetch(`${API_URL}/api/fees/structures`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Grade 10 Tuition Fee',
        amount: 60000.00,
        type: 'tuition',
        appliesTo: 'class_10',
        academicYearId: yearId
      })
    });
    const feeStructure = await feeCreateRes.json();
    if (feeCreateRes.status !== 201 || Number(feeStructure.amount) !== 60000 || feeStructure.version !== 1) {
      throw new Error(`Failed to create correct fee structure: ${JSON.stringify(feeStructure)}`);
    }
    console.log(`✓ Fee structure created: ${feeStructure.name} v${feeStructure.version} (Amount: ${feeStructure.amount})\n`);

    // 4. Test Versioned Fee Structure Update (PUT)
    console.log('[Step 4] Testing Versioned Fee Structure Update (PUT)...');
    const feeUpdateRes = await fetch(`${API_URL}/api/fees/structures/${feeStructure.id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Grade 10 Tuition Fee - Revised',
        amount: 65000.00,
        appliesTo: 'class_10_special'
      })
    });
    const updatedStructure = await feeUpdateRes.json();
    if (feeUpdateRes.status !== 200) {
      throw new Error(`PUT update failed: ${JSON.stringify(updatedStructure)}`);
    }
    if (updatedStructure.id === feeStructure.id) {
      throw new Error('Error: PUT mutated the same database row instead of creating a new one');
    }
    if (updatedStructure.version !== 2 || Number(updatedStructure.amount) !== 65000) {
      throw new Error(`Error: Updated structure has wrong version or amount: ${JSON.stringify(updatedStructure)}`);
    }

    // Verify both versions exist in database
    const dbStructures = await prisma.feeStructure.findMany({
      where: {
        name: { startsWith: 'Grade 10 Tuition Fee' }
      }
    });
    if (dbStructures.length !== 2) {
      throw new Error('Error: Original structure version was overwritten or lost');
    }
    console.log(`✓ Versioning verified: Original v1 retained. New v2 appended (Amount: ${updatedStructure.amount}, Version: ${updatedStructure.version})\n`);

    // 5. Test Guardian Signup with Student (Stage 1)
    console.log('[Step 5] Testing Guardian Signup with Student details (Stage 1)...');
    const guardianSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const gMobile = '888888' + guardianSuffix;
    const gEmail = `parent_${guardianSuffix}@mail.com`;

    const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        mobile: gMobile,
        email: gEmail,
        password: 'password123',
        role: 'guardian',
        studentName: 'Timmy Doe',
        studentClass: 'Grade 10-B',
        studentDob: '2015-05-15'
      })
    });
    const signupData = await signupRes.json();
    if (signupRes.status !== 201) {
      throw new Error(`Guardian signup failed: ${JSON.stringify(signupData)}`);
    }

    const gToken = signupData.token;
    const gHeaders = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gToken}` 
    };
    const student = signupData.student;

    if (!student || student.status !== 'pending' || !student.consentChecked) {
      throw new Error('Failed to register student or capture consent during signup transaction');
    }
    console.log(`✓ Guardian and Student registered. Student: ${student.name} (Status: ${student.status}, Consent: ${student.consentChecked})\n`);

    // 6. Test KYC Upload - Matching Details
    console.log('[Step 6] Testing KYC Upload with Matching Details...');
    const kycMatchRes = await fetch(`${API_URL}/api/students/kyc`, {
      method: 'POST',
      headers: gHeaders,
      body: JSON.stringify({
        studentId: student.id,
        docType: 'aadhaar',
        docRef: '1234 5678 9012',
        ocrData: {
          name: 'Timmy Doe',
          dob: '2015-05-15',
          rawText: 'GOVERNMENT OF INDIA\nTimmy Doe\nDOB: 15/05/2015\nVID: 1234 5678 9012'
        }
      })
    });
    const kycRecord = await kycMatchRes.json();
    if (kycMatchRes.status !== 200 || kycRecord.ocrFlagged !== false) {
      throw new Error(`KYC matched check failed: ${JSON.stringify(kycRecord)}`);
    }
    if (kycRecord.docRef !== '**** **** 9012') {
      throw new Error(`DocRef was not masked correctly: got ${kycRecord.docRef}`);
    }
    console.log(`✓ KYC matched and stored. DocRef masked safely: ${kycRecord.docRef} (Flagged: ${kycRecord.ocrFlagged})\n`);

    // 7. Test KYC Upload - Mismatch Details (Flagging)
    console.log('[Step 7] Testing KYC Upload with Mismatch Details (Flagging)...');
    const guardianSuffix2 = Math.floor(1000 + Math.random() * 9000).toString();
    const gMobile2 = '888888' + guardianSuffix2;
    const gEmail2 = `parent_${guardianSuffix2}@mail.com`;

    const signupRes2 = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mary Smith',
        mobile: gMobile2,
        email: gEmail2,
        password: 'password123',
        role: 'guardian',
        studentName: 'Bobby Smith',
        studentClass: 'Grade 5-A',
        studentDob: '2018-09-20'
      })
    });
    const signupData2 = await signupRes2.json();
    if (signupRes2.status !== 201) {
      throw new Error(`Guardian signup 2 failed: ${JSON.stringify(signupData2)}`);
    }

    const student2 = signupData2.student;
    const gToken2 = signupData2.token;
    const gHeaders2 = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gToken2}` 
    };

    const kycMismatchRes = await fetch(`${API_URL}/api/students/kyc`, {
      method: 'POST',
      headers: gHeaders2,
      body: JSON.stringify({
        studentId: student2.id,
        docType: 'birth_certificate',
        docRef: 'BC-998811',
        ocrData: {
          name: 'Boby Smith', // Typo mismatch
          dob: '2018-09-21',  // DOB mismatch
          rawText: 'BIRTH CERTIFICATE\nState of Maharashtra\nChild Name: Boby Smith\nDate of Birth: 21/09/2018'
        }
      })
    });
    const kycRecord2 = await kycMismatchRes.json();
    if (kycMismatchRes.status !== 200 || kycRecord2.ocrFlagged !== true) {
      throw new Error(`KYC mismatch check failed to flag: ${JSON.stringify(kycRecord2)}`);
    }
    console.log(`✓ Mismatch successfully flagged. Student ID: ${student2.id} (Flagged: ${kycRecord2.ocrFlagged})\n`);

    // 8. Test Pending Approvals fetch
    console.log('[Step 8] Testing Pending Approvals List...');
    const approvalsRes = await fetch(`${API_URL}/api/admin/approvals`, {
      method: 'GET',
      headers: adminHeaders
    });
    const approvals = await approvalsRes.json();
    if (approvalsRes.status !== 200 || approvals.length !== 2) {
      throw new Error(`Expected 2 pending approvals, got status ${approvalsRes.status} and length ${approvals.length}`);
    }
    console.log(`✓ Pending approvals list retrieved: found ${approvals.length} students awaiting verification.\n`);

    // 9. Test Direct Admin KYC Verification
    console.log('[Step 9] Testing Direct KYC Verification Approval...');
    const approveRes = await fetch(`${API_URL}/api/admin/approvals/${student.id}/verify`, {
      method: 'POST',
      headers: adminHeaders
    });
    const approveData = await approveRes.json();
    if (approveRes.status !== 200 || !approveData.success || approveData.student.status !== 'active') {
      throw new Error(`Failed to verify matching student KYC: ${JSON.stringify(approveData)}`);
    }
    console.log(`✓ Direct KYC verification success. Student status set to active.\n`);

    // 10. Test Admin Manual Override & Approval
    console.log('[Step 10] Testing Admin Manual Override Approval...');
    const overrideRes = await fetch(`${API_URL}/api/admin/approvals/${student2.id}/override`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Bobby Smith', // corrected name
        class: 'Grade 5-A',
        dob: '2018-09-20'    // corrected DOB
      })
    });
    const overrideData = await overrideRes.json();
    if (overrideRes.status !== 200 || !overrideData.success || overrideData.student.name !== 'Bobby Smith' || overrideData.student.status !== 'active') {
      throw new Error(`Failed to override and approve mismatched student KYC: ${JSON.stringify(overrideData)}`);
    }
    console.log(`✓ Admin Manual Override success: Details corrected and student set to active.\n`);

    console.log('=============================================');
    console.log('🎉 ALL DAY 2 INTEGRATION TESTS PASSED! 🎉');
    console.log('=============================================');

  } catch (error) {
    console.error('\n❌ TEST RUN FAILED:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
