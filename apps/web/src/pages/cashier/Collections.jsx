import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { addPaymentToQueue } from '../../utils/idb';
import { Card, PillButton, InputField, SelectField, Alert, Eyebrow } from '../../components/ui/Primitives';
import { Icon } from '../../components/Icon';

export default function Collections() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [chequeNo, setChequeNo] = useState('');
  const [bank, setBank] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const handleOCRChequeScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      console.log('OCR Raw output text:', text);

      // Extract 6-digit cheque number
      const numMatch = text.match(/\b\d{6}\b/);
      if (numMatch) {
        setChequeNo(numMatch[0]);
      }

      // Detect standard bank names from keywords
      const keywords = ['ICICI', 'HDFC', 'AXIS', 'SBI', 'STATE BANK', 'PUNJAB', 'PNB', 'CANARA', 'BOB', 'BANK OF BARODA', 'KOTAK', 'YES BANK', 'UNION'];
      let foundBank = '';
      const upperStr = text.toUpperCase();

      for (const kw of keywords) {
        if (upperStr.includes(kw)) {
          foundBank = kw === 'SBI' || kw === 'STATE BANK' ? 'State Bank of India' :
                      kw === 'PNB' || kw === 'PUNJAB' ? 'Punjab National Bank' :
                      kw === 'BOB' || kw === 'BANK OF BARODA' ? 'Bank of Baroda' :
                      kw + ' Bank';
          break;
        }
      }

      if (foundBank) {
        setBank(foundBank);
      }

      if (numMatch || foundBank) {
        setSuccess(`OCR Scanned Successfully! Extracted Cheque No: "${numMatch ? numMatch[0] : 'Not Found'}" and Bank: "${foundBank || 'Not Found'}".`);
      } else {
        setError('OCR scan finished but failed to read cheque number or bank name. Please type details manually.');
      }
    } catch (err) {
      console.error(err);
      setError('OCR Scanner error: ' + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // Fetch student roster
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.status === 200) {
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch student roster.');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch pending assignments for the selected student
  useEffect(() => {
    if (!selectedStudentId) {
      setAssignments([]);
      return;
    }

    const fetchAssignments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/fees/assignments?studentId=${selectedStudentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.status === 200) {
          // Filter to only pending/overdue assignments
          setAssignments(data.filter(a => a.status === 'pending' || a.status === 'overdue'));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchAssignments();
  }, [selectedStudentId]);

  // Set default amount when assignment is chosen
  useEffect(() => {
    if (!selectedAssignmentId) {
      setAmount('');
      return;
    }
    const chosen = assignments.find(a => a.id === Number(selectedAssignmentId));
    if (chosen && chosen.feeStructure) {
      setAmount(chosen.feeStructure.amount.toString());
    }
  }, [selectedAssignmentId, assignments]);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.guardian?.mobile || '').includes(searchQuery)
  );

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('token');
    const selectedStudent = students.find(s => s.id === Number(selectedStudentId));
    const selectedAssign = assignments.find(a => a.id === Number(selectedAssignmentId));

    if (!selectedStudent || !selectedAssign) {
      setError('Please select a student and an outstanding fee assignment.');
      setLoading(false);
      return;
    }

    // Client-side generated idempotency key (prevent duplicates)
    const idempotencyKey = `OFF_${selectedAssignmentId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const paymentPayload = {
      student_id: selectedStudent.id,
      fee_assignment_id: selectedAssign.id,
      amount: Number(amount),
      method,
      cheque_no: method === 'CHEQUE' ? chequeNo : undefined,
      bank: method === 'CHEQUE' ? bank : undefined,
      idempotency_key: idempotencyKey,
      timestamp: new Date().toISOString(),
      token: token // Attach cashier session token for background sync authentication
    };

    // If browser is offline, queue to IndexedDB directly
    if (!navigator.onLine) {
      try {
        await addPaymentToQueue(paymentPayload);

        // Trigger Background Sync tag
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const reg = await navigator.serviceWorker.ready;
          await reg.sync.register('sync-payments');
        }

        setSuccess('Offline Mode: Payment saved in local queue. It will automatically sync when network is restored.');
        // Reset inputs
        setSelectedAssignmentId('');
        setChequeNo('');
        setBank('');
      } catch (err) {
        setError('Failed to queue offline payment: ' + err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Else send online
    try {
      const res = await fetch('/api/payments/offline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(paymentPayload)
      });

      const data = await res.json();
      if (res.status === 200 || res.status === 201) {
        setSuccess(`Payment recorded successfully! Receipt generated: ${data.receiptNumber || 'Pending clearance'}`);
        // Reset selections
        setSelectedAssignmentId('');
        setChequeNo('');
        setBank('');
      } else {
        setError(data.error || 'Failed to submit payment.');
      }
    } catch (err) {
      setError('Network request failed. Payment queued to IndexedDB instead.');
      try {
        await addPaymentToQueue(paymentPayload);
      } catch (idbErr) {
        console.error(idbErr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-section-sm max-w-[680px] mx-auto w-full">
      <header>
        <Eyebrow>Collect Fees</Eyebrow>
        <h1 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight mt-2">
          Record Manual Collection
        </h1>
        <p className="font-body text-[14px] text-on-surface-variant mt-2">
          Record cash or cheque collections for student accounts. Works 100% offline.
        </p>
      </header>

      <Card>
        <Alert tone="error">{error}</Alert>
        <Alert tone="success">{success}</Alert>

        <form onSubmit={handleRecordPayment} className="flex flex-col gap-5 mt-2">
          {/* Student Finder */}
          <div className="flex flex-col gap-2 relative">
            <label htmlFor="student-search" className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider">
              Search Student (Name or Mobile)
            </label>
            <input
              id="student-search"
              type="text"
              className="w-full h-12 px-4 rounded-full border border-outline-variant/50 bg-surface focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black font-body text-body text-ink-black placeholder:text-outline transition-all"
              placeholder="Type name or mobile..."
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
            />

            {isDropdownOpen && searchQuery && (
              <div className="absolute top-[72px] left-0 right-0 z-10 bg-lifted-cream border border-outline-variant/50 rounded-[20px] shadow-lifted max-h-[150px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="p-3 text-on-surface-variant text-[13px]">No students found</div>
                ) : (
                  filteredStudents.map(student => (
                    <div
                      key={student.id}
                      className="p-3 cursor-pointer border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low text-[13px]"
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setSearchQuery(`${student.name} (${student.class})`);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <span className="font-medium text-ink-black">{student.name}</span>
                      <span className="text-on-surface-variant ml-2">
                        ({student.class} | Guardian: {student.guardian?.mobile})
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Student Confirm */}
          {selectedStudentId && (
            <div className="bg-surface-container-low border border-outline-variant/40 p-3 rounded-[20px] text-[13px] text-ink-black">
              Selected Ward: <strong>{students.find(s => s.id === Number(selectedStudentId))?.name}</strong>
            </div>
          )}

          <SelectField
            label="Outstanding Fee Assignment"
            id="collect-assign"
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            required
          >
            <option value="" disabled>-- Select Pending Fee --</option>
            {assignments.map(a => (
              <option key={a.id} value={a.id}>
                {a.feeStructure.name} (₹{Number(a.feeStructure.amount).toLocaleString('en-IN')})
              </option>
            ))}
          </SelectField>

          <InputField
            label="Amount (INR)"
            id="collect-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          {/* Payment Method Selector */}
          <div className="flex flex-col gap-2">
            <span className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider">Payment Method</span>
            <div className="flex gap-3">
              {['CASH', 'CHEQUE'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 h-11 font-nav-button text-nav-button text-[14px] transition-colors ${method === m ? 'bg-ink-black text-canvas-cream' : 'border border-outline-variant text-ink-black hover:bg-surface-container-low'}`}
                >
                  <Icon name={m === 'CASH' ? 'payments' : 'receipt_long'} className="text-[18px]" />
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Cheque Details form */}
          {method === 'CHEQUE' && (
            <div className="bg-surface-container-low p-5 rounded-frame border border-outline-variant/40 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="cheque-scan" className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider flex items-center gap-2">
                  <Icon name="document_scanner" className="text-[18px] text-light-signal-orange" /> OCR Auto-Scan Cheque
                </label>
                <input
                  id="cheque-scan"
                  type="file"
                  accept="image/*"
                  onChange={handleOCRChequeScan}
                  className="w-full h-12 px-4 rounded-full border border-outline-variant/50 bg-surface font-body text-body text-ink-black file:mr-4 file:border-0 file:bg-ink-black file:text-canvas-cream file:rounded-full file:px-4 file:h-9 file:font-nav-button file:text-nav-button"
                />
                {ocrLoading && (
                  <span className="text-[13px] text-light-signal-orange flex items-center gap-1">
                    <Icon name="sync" className="text-[16px] animate-spin" /> Running OCR scanner analysis on cheque image…
                  </span>
                )}
              </div>

              <InputField
                label="Cheque Number"
                id="cheque-no"
                value={chequeNo}
                onChange={(e) => setChequeNo(e.target.value)}
                placeholder="e.g. 123456"
                required
              />
              <InputField
                label="Bank Name"
                id="cheque-bank"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="e.g. State Bank of India"
                required
              />
            </div>
          )}

          <PillButton type="submit" disabled={loading} className="mt-1">
            {loading ? 'Recording…' : 'Record Payment'}
          </PillButton>
        </form>
      </Card>
    </div>
  );
}
