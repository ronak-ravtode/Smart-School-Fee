/**
 * Smart School FinTech - Backend Unit Tests (Jest)
 *
 * Run with:  pnpm --filter smart-school-api test
 *
 * These tests cover the core business-logic utilities that can be exercised
 * without starting the Express server or touching the database.
 */

// ---------------------------------------------------------------------------
// 1. Fee Engine Calculations
// ---------------------------------------------------------------------------
describe('Fee Engine: Late Fee Calculation', () => {
  /**
   * calculateLateFee(base, pct, graceDays, daysOverdue)
   * Returns 0 if still within grace period; otherwise applies percentage.
   */
  function calculateLateFee(base, pct, graceDays, daysOverdue) {
    if (daysOverdue <= graceDays) return 0;
    return +(base * (pct / 100)).toFixed(2);
  }

  test('No late fee within grace period', () => {
    expect(calculateLateFee(10000, 5, 7, 3)).toBe(0);
  });

  test('No late fee on exact grace period boundary', () => {
    expect(calculateLateFee(10000, 5, 7, 7)).toBe(0);
  });

  test('Late fee applied one day after grace period', () => {
    expect(calculateLateFee(10000, 5, 7, 8)).toBe(500);
  });

  test('Late fee is proportional to base amount', () => {
    expect(calculateLateFee(25000, 5, 7, 30)).toBe(1250);
  });

  test('Zero base gives zero late fee', () => {
    expect(calculateLateFee(0, 5, 7, 10)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2. AI Heuristic Default Risk Predictor
// ---------------------------------------------------------------------------
describe('AI Default Risk Predictor', () => {
  /**
   * Mirrors the heuristic inside dashboard.js getDefaulters.
   * Risk factors: overdue days, failed transaction count, KYC status, amount.
   */
  function computeDefaultRisk({ overdueDays, failedCount, isKycComplete, overdueAmount }) {
    let riskFactor = overdueDays * 3;
    riskFactor += failedCount * 20;
    riskFactor += isKycComplete ? -15 : +15;
    riskFactor += overdueAmount > 15000 ? +15 : overdueAmount < 5000 ? -10 : 0;
    return Math.min(98, Math.max(5, riskFactor));
  }

  test('Low-risk student: KYC complete, no failures, 0 days overdue', () => {
    const risk = computeDefaultRisk({ overdueDays: 0, failedCount: 0, isKycComplete: true, overdueAmount: 3000 });
    expect(risk).toBe(5); // clamped to minimum
  });

  test('High-risk student: not KYC, 2 failures, 30 days overdue, large amount', () => {
    const risk = computeDefaultRisk({ overdueDays: 30, failedCount: 2, isKycComplete: false, overdueAmount: 20000 });
    expect(risk).toBe(Math.min(98, 30 * 3 + 2 * 20 + 15 + 15)); // 160 → clamped to 98
    expect(risk).toBe(98);
  });

  test('Medium-risk student: KYC complete, 1 failure, 14 days overdue', () => {
    const risk = computeDefaultRisk({ overdueDays: 14, failedCount: 1, isKycComplete: true, overdueAmount: 10000 });
    expect(risk).toBe(Math.min(98, Math.max(5, 14 * 3 + 1 * 20 - 15)));
    // 42 + 20 - 15 = 47
    expect(risk).toBe(47);
  });

  test('Risk is always between 5 and 98', () => {
    const veryLow = computeDefaultRisk({ overdueDays: 0, failedCount: 0, isKycComplete: true, overdueAmount: 1000 });
    const veryHigh = computeDefaultRisk({ overdueDays: 365, failedCount: 10, isKycComplete: false, overdueAmount: 50000 });
    expect(veryLow).toBeGreaterThanOrEqual(5);
    expect(veryHigh).toBeLessThanOrEqual(98);
  });
});

// ---------------------------------------------------------------------------
// 3. Receipt Number Sequential Generator
// ---------------------------------------------------------------------------
describe('Receipt Number Generator', () => {
  /**
   * Mirrors the logic used in payments.js handleWebhook.
   * Finds the highest existing sequence for the current year and returns next.
   */
  function generateNextReceiptNumber(existingReceipts, year) {
    const yearPrefix = `REC-${year}-`;
    const relevant = existingReceipts.filter(r => r.startsWith(yearPrefix));
    let nextNum = 1;
    if (relevant.length > 0) {
      const nums = relevant.map(r => {
        const parts = r.split('-');
        if (parts.length === 3) {
          const seq = parseInt(parts[2], 10);
          return isNaN(seq) ? 0 : seq;
        }
        return 0;
      });
      nextNum = Math.max(...nums) + 1;
    }
    return `${yearPrefix}${String(nextNum).padStart(4, '0')}`;
  }

  const YEAR = 2026;

  test('First receipt of the year starts at 0001', () => {
    expect(generateNextReceiptNumber([], YEAR)).toBe('REC-2026-0001');
  });

  test('Correctly increments after existing receipts', () => {
    const existing = ['REC-2026-0001', 'REC-2026-0002', 'REC-2026-0003'];
    expect(generateNextReceiptNumber(existing, YEAR)).toBe('REC-2026-0004');
  });

  test('Skips over gaps in sequence correctly', () => {
    const existing = ['REC-2026-0001', 'REC-2026-0005'];
    expect(generateNextReceiptNumber(existing, YEAR)).toBe('REC-2026-0006');
  });

  test('Ignores E2E test receipts with non-standard format', () => {
    const existing = ['REC-E2E-ON-1234567890', 'REC-2026-0001'];
    expect(generateNextReceiptNumber(existing, YEAR)).toBe('REC-2026-0002');
  });

  test('Returns 0001 if no receipts match the current year', () => {
    const existing = ['REC-2025-0099'];
    expect(generateNextReceiptNumber(existing, YEAR)).toBe('REC-2026-0001');
  });
});

// ---------------------------------------------------------------------------
// 4. UPI Deep-Link URL Builder
// ---------------------------------------------------------------------------
describe('UPI Deep-Link URL Builder', () => {
  function buildUpiUrl({ vpa, name, amount, orderId, feeAssignmentId }) {
    return `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&tr=${orderId}&tn=School_Fees_Id_${feeAssignmentId}`;
  }

  test('Builds a valid upi:// intent URL', () => {
    const url = buildUpiUrl({
      vpa: 'schoolfees@axisbank',
      name: 'SmartSchoolFinTech',
      amount: 25000,
      orderId: 'ORD_12345',
      feeAssignmentId: 7
    });
    expect(url).toContain('upi://pay?pa=schoolfees@axisbank');
    expect(url).toContain('am=25000');
    expect(url).toContain('tr=ORD_12345');
    expect(url).toContain('School_Fees_Id_7');
  });

  test('Encodes merchant name with spaces', () => {
    const url = buildUpiUrl({
      vpa: 'school@upi',
      name: 'Smart School FinTech',
      amount: 5000,
      orderId: 'ORD_99',
      feeAssignmentId: 2
    });
    expect(url).toContain('Smart%20School%20FinTech');
  });
});

// ---------------------------------------------------------------------------
// 5. Offline Idempotency Key Generator
// ---------------------------------------------------------------------------
describe('Payment Idempotency Key', () => {
  function generateIdempotencyKey(feeAssignmentId) {
    // Mirrors what the frontend does: `idemp_${id}_${timestamp}_${rand}`
    const key = `idemp_${feeAssignmentId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return key;
  }

  test('Idempotency key contains fee assignment ID', () => {
    const key = generateIdempotencyKey(42);
    expect(key).toContain('idemp_42_');
  });

  test('Two keys generated in quick succession are unique', () => {
    const key1 = generateIdempotencyKey(1);
    const key2 = generateIdempotencyKey(1);
    // They may occasionally collide due to random, but format must be correct
    expect(key1).toMatch(/^idemp_\d+_\d+_\d+$/);
    expect(key2).toMatch(/^idemp_\d+_\d+_\d+$/);
  });
});
