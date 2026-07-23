import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { addPaymentToQueue } from '../../utils/idb';
import GlassCard from '../../components/ui/GlassCard';
import ActionButton from '../../components/ui/ActionButton';
import PageHeader from '../../components/ui/PageHeader';
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

      const numMatch = text.match(/\b\d{6}\b/);
      if (numMatch) {
        setChequeNo(numMatch[0]);
      }

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
          setAssignments(data.filter(a => a.status === 'pending' || a.status === 'overdue'));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchAssignments();
  }, [selectedStudentId]);

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
      token: token
    };

    if (!navigator.onLine) {
      try {
        await addPaymentToQueue(paymentPayload);

        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const reg = await navigator.serviceWorker.ready;
          await reg.sync.register('sync-payments');
        }

        setSuccess('Offline Mode: Payment saved in local queue. It will automatically sync when network is restored.');
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
    <div className="max-w-[680px] mx-auto w-full">
      <PageHeader
        eyebrow="Collect Fees"
        title="Record Manual Collection"
        subtitle="Record cash or cheque collections for student accounts. Works 100% offline."
      />

      <GlassCard>
        {error && <div className="p-4 rounded-[12px] bg-error-container text-error text-sm mb-4">{error}</div>}
        {success && <div className="p-4 rounded-[12px] bg-success-container text-success text-sm mb-4">{success}</div>}

        <form onSubmit={handleRecordPayment} className="flex flex-col gap-5 mt-2">
          <div className="flex flex-col gap-2 relative">
            <label className="block text-sm font-medium text-ink-black mb-1">Search Student (Name or Mobile)</label>
            <input
              type="text"
              className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
              placeholder="Type name or mobile..."
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
            />

            {isDropdownOpen && searchQuery && (
              <div className="absolute top-[72px] left-0 right-0 z-10 bg-white border border-gray-200 rounded-[12px] shadow-lg max-h-[150px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="p-3 text-on-surface-variant text-sm">No students found</div>
                ) : (
                  filteredStudents.map(student => (
                    <div
                      key={student.id}
                      className="p-3 cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50 text-sm"
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

          {selectedStudentId && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-[12px] text-sm text-ink-black">
              Selected Ward: <strong>{students.find(s => s.id === Number(selectedStudentId))?.name}</strong>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-black mb-1">Outstanding Fee Assignment</label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
            >
              <option value="" disabled>-- Select Pending Fee --</option>
              {assignments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.feeStructure.name} (₹{Number(a.feeStructure.amount).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-black mb-1">Amount (INR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-ink-black mb-2">Payment Method</span>
            <div className="flex gap-3">
              {['CASH', 'CHEQUE'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`inline-flex items-center gap-2 rounded-buttons px-5 h-11 text-sm font-medium transition-all ${method === m ? 'bg-ink-black text-white' : 'border border-gray-200 text-ink-black hover:bg-gray-50'}`}
                >
                  <Icon name={m === 'CASH' ? 'payments' : 'receipt_long'} className="text-lg" />
                  {m}
                </button>
              ))}
            </div>
          </div>

          {method === 'CHEQUE' && (
            <div className="bg-gray-50 p-5 rounded-[12px] border border-gray-200 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-ink-black mb-1 flex items-center gap-2">
                  <Icon name="document_scanner" className="text-lg" /> OCR Auto-Scan Cheque
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOCRChequeScan}
                  className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black file:mr-4 file:border-0 file:bg-ink-black file:text-white file:rounded-buttons file:px-4 file:h-8 file:text-sm"
                />
                {ocrLoading && (
                  <span className="text-sm text-module-reconciliation flex items-center gap-1 mt-1">
                    <Icon name="sync" className="text-base animate-spin" /> Running OCR scanner analysis…
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-black mb-1">Cheque Number</label>
                <input
                  value={chequeNo}
                  onChange={(e) => setChequeNo(e.target.value)}
                  placeholder="e.g. 123456"
                  required
                  className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-black mb-1">Bank Name</label>
                <input
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  required
                  className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
                />
              </div>
            </div>
          )}

          <ActionButton type="submit" disabled={loading}>
            {loading ? 'Recording…' : 'Record Payment'}
          </ActionButton>
        </form>
      </GlassCard>
    </div>
  );
}
