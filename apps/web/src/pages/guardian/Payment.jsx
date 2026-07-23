import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentButton from '../../components/common/PaymentButton';
import { Icon } from '../../components/Icon';
import GlassCard from '../../components/ui/GlassCard';
import PageHeader from '../../components/ui/PageHeader';
import StatusChip from '../../components/ui/StatusChip';

export default function Payment() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    <div>
      <PageHeader
        eyebrow="Pay Fees"
        title="Fee Ledger & Payments"
      />

      <GlassCard className="mb-6">
        <h2 className="font-medium text-ink-black mb-2">Select Student Profile</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Select one of your linked children to view outstanding school fees and clear transactions.
        </p>

        {students.length === 0 ? (
          <div className="text-on-surface-variant text-sm">No registered student records found.</div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {students.map(s => (
              <button
                key={s.id}
                type="button"
                className={`inline-flex items-center gap-2 rounded-buttons px-5 h-11 text-sm font-medium transition-all ${selectedStudentId === s.id.toString() ? 'bg-ink-black text-white' : 'border border-gray-200 text-ink-black hover:bg-gray-50'}`}
                onClick={() => setSelectedStudentId(s.id.toString())}
              >
                {s.name} ({s.class})
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      {selectedStudent && (
        <GlassCard>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-200">
            <div>
              <h2 className="font-medium text-ink-black">Fee Ledger: {selectedStudent.name}</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Verify minor details and process payments safely. UPI transactions are zero-fee under NPCI guidelines.
              </p>
            </div>
            <StatusChip variant={selectedStudent.status === 'active' ? 'success' : 'pending'} className="capitalize">
              KYC Status: {selectedStudent.status}
            </StatusChip>
          </div>

          {error && <div className="p-4 rounded-[12px] bg-error-container text-error text-sm mb-4">{error}</div>}

          {loading ? (
            <div className="text-center py-12 text-on-surface-variant text-sm">Loading assigned fee schedules…</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant text-sm">
              No outstanding fees have been assigned to {selectedStudent.name} for the active term.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-on-surface-variant text-xs uppercase tracking-wider">
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
                      <tr key={asg.id} className="border-b border-gray-100">
                        <td className="p-3 font-semibold text-ink-black">{asg.feeStructure.name}</td>
                        <td className="p-3 text-on-surface-variant">Term {asg.feeStructure.academicYear.label}</td>
                        <td className="p-3 font-bold text-ink-black">₹{Number(asg.feeStructure.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-on-surface-variant">{new Date(asg.dueDate).toLocaleDateString()} {isOverdue && <span className="text-error">(Overdue)</span>}</td>
                        <td className="p-3">
                          <StatusChip variant={asg.status === 'paid' ? 'success' : 'pending'}>{asg.status}</StatusChip>
                        </td>
                        <td className="p-3 text-right">
                          {asg.status === 'paid' ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-3 h-9 rounded-buttons border border-gray-200 text-ink-black text-sm hover:bg-gray-50 transition-colors"
                              onClick={() => handleDownloadReceipt(asg.id)}
                            >
                              <Icon name="download" className="text-base" /> Receipt (PDF)
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
        </GlassCard>
      )}
    </div>
  );
}
