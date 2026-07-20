import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentButton from '../../components/common/PaymentButton';
import { Icon } from '../../components/Icon';
import { Card, Alert, Eyebrow, StatusBadge } from '../../components/ui/Primitives';

export default function Payment() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch wards
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const res = await axios.get('/api/guardians/students');
        setStudents(res.data);
        if (res.data.length > 0) {
          setSelectedStudentId(res.data[0].id.toString());
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch linked student details.');
      }
    };
    fetchWards();
  }, []);

  // 2. Fetch assignments when selected ward changes
  useEffect(() => {
    if (!selectedStudentId) return;
    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/fees/assignments?studentId=${selectedStudentId}`);
        setAssignments(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load fee assignments.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [selectedStudentId]);

  const handleDownloadReceipt = async (assignmentId) => {
    try {
      // Find the success transaction for this assignment
      const txRes = await axios.get('/api/payments/transactions');
      const tx = txRes.data.find(t => t.feeAssignmentId === assignmentId && t.status === 'success');
      if (!tx) {
        alert('Receipt document is being generated. Please check back in a moment.');
        return;
      }

      const receiptRes = await axios.get(`/api/payments/receipt?transaction_id=${tx.id}`);
      const link = document.createElement('a');
      link.href = receiptRes.data.receiptUrl;
      link.download = `Receipt-${tx.receiptNumber || 'Payment'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve receipt.');
    }
  };

  const selectedStudent = students.find(s => s.id.toString() === selectedStudentId);

  return (
    <div className="flex flex-col gap-section-sm">
      <header>
        <Eyebrow>Pay Fees</Eyebrow>
        <h1 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight mt-2">
          Fee Ledger & Payments
        </h1>
      </header>

      {/* Ward Selector Section */}
      <Card>
        <h2 className="font-headline-sm text-headline-sm text-ink-black mb-2">Select Student Profile</h2>
        <p className="font-body text-[14px] text-on-surface-variant mb-6">
          Select one of your linked children to view outstanding school fees and clear transactions.
        </p>

        {students.length === 0 ? (
          <div className="text-on-surface-variant text-[14px]">No registered student records found.</div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {students.map(s => (
              <button
                key={s.id}
                type="button"
                className={`inline-flex items-center gap-2 rounded-full px-5 h-11 font-nav-button text-nav-button text-[14px] transition-colors ${selectedStudentId === s.id.toString() ? 'bg-ink-black text-canvas-cream' : 'border border-outline-variant text-ink-black hover:bg-surface-container-low'}`}
                onClick={() => setSelectedStudentId(s.id.toString())}
              >
                {s.name} ({s.class})
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Outstanding Fees Panel */}
      {selectedStudent && (
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-outline-variant/40">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-ink-black">Fee Ledger: {selectedStudent.name}</h2>
              <p className="font-body text-[13px] text-on-surface-variant mt-1">
                Verify minor details and process payments safely. UPI transactions are zero-fee under NPCI guidelines.
              </p>
            </div>
            <StatusBadge tone={selectedStudent.status === 'active' ? 'active' : 'pending'} className="capitalize">
              KYC Status: {selectedStudent.status}
            </StatusBadge>
          </div>

          <Alert tone="error">{error}</Alert>

          {loading ? (
            <div className="text-center py-12 text-on-surface-variant text-[14px]">Loading assigned fee schedules…</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant text-[14px]">
              No outstanding fees have been assigned to {selectedStudent.name} for the active term.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[14px]">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-on-surface-variant font-eyebrow text-eyebrow uppercase tracking-wider">
                    <th className="p-3">Fee Component</th>
                    <th className="p-3">Academic Term</th>
                    <th className="p-3">Amount Due</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Payment Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((asg) => {
                    const isOverdue = new Date(asg.dueDate) < new Date() && asg.status !== 'paid';
                    return (
                      <tr key={asg.id} className="border-b border-outline-variant/20">
                        <td className="p-3 font-semibold text-ink-black">{asg.feeStructure.name}</td>
                        <td className="p-3 text-on-surface-variant">Term {asg.feeStructure.academicYear.label}</td>
                        <td className="p-3 font-bold text-ink-black">₹{Number(asg.feeStructure.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-on-surface-variant">{new Date(asg.dueDate).toLocaleDateString()} {isOverdue && <span className="text-error">(Overdue)</span>}</td>
                        <td className="p-3">
                          <StatusBadge tone={asg.status === 'paid' ? 'active' : 'pending'}>{asg.status}</StatusBadge>
                        </td>
                        <td className="p-3 text-right">
                          {asg.status === 'paid' ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-3 h-9 rounded-full border border-outline-variant text-ink-black text-[13px] hover:bg-surface-container-low transition-colors"
                              onClick={() => handleDownloadReceipt(asg.id)}
                            >
                              <Icon name="download" className="text-[16px]" /> Receipt (PDF)
                            </button>
                          ) : (
                            <PaymentButton
                              feeAssignmentId={asg.id}
                              amount={asg.feeStructure.amount}
                              disabled={selectedStudent.status !== 'active'}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
