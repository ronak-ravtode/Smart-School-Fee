import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Stage2KYC from './Stage2KYC';
import { Icon } from '../../components/Icon';
import { Card, Alert, Eyebrow, StatusBadge } from '../../components/ui/Primitives';

export default function Receipts() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Bank form overlay states
  const [kycStudentId, setKycStudentId] = useState(null);
  const [checkingTx, setCheckingTx] = useState(null);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/payments/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load transaction history ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDownloadReceipt = async (transactionId, receiptNumber) => {
    try {
      const res = await axios.get(`/api/payments/receipt?transaction_id=${transactionId}`);
      const link = document.createElement('a');
      link.href = res.data.receiptUrl;
      link.download = `Receipt-${receiptNumber || 'Payment'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve PDF receipt document.');
    }
  };

  const handleRequestRefund = async (tx) => {
    setError(null);
    setSuccess(null);
    setCheckingTx(tx);

    try {
      const token = localStorage.getItem('token');
      // Query if this student has Stage 2 KYC complete.
      // We can check this by hitting our list or checking the student details.
      const res = await fetch(`/api/guardians/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const students = await res.json();
      const match = students.find(s => s.id === tx.studentId);

      if (match && match.kycRecord && match.kycRecord.isBankingComplete) {
        setSuccess(`Stage 2 KYC is complete for ${tx.student.name}. Please contact the school admin to process your refund.`);
      } else {
        // Open Stage 2 KYC form
        setKycStudentId(tx.studentId);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to verify Stage 2 KYC status.');
    }
  };

  // Filter out pending/failed transactions for receipt list (only show success or reversed)
  const successfulTxns = transactions.filter(t => t.status === 'success' || t.status === 'reversed');

  return (
    <div className="flex flex-col gap-section-sm">
      <header>
        <Eyebrow>Receipt History</Eyebrow>
        <h1 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight mt-2">
          Ledger &amp; Digital Receipts
        </h1>
        <p className="font-body text-[14px] text-on-surface-variant mt-2">
          Access your digital billing ledger and download official signed PDF receipts for all educational fee payments.
        </p>
      </header>

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{success}</Alert>

      {/* Stage 2 KYC Overlay */}
      {kycStudentId && (
        <div className="flex flex-col gap-4">
          <Alert tone="error">⚠ Stage 2 KYC (Banking Details) is required to process refunds. Please complete the form below.</Alert>
          <Stage2KYC
            studentId={kycStudentId}
            onSuccess={() => {
              setKycStudentId(null);
              setSuccess('Banking details submitted! Please notify the school administrator to release your refund.');
              fetchTransactions();
            }}
            onCancel={() => setKycStudentId(null)}
          />
        </div>
      )}

      <Card>
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant text-[14px]">Loading transaction receipts…</div>
        ) : successfulTxns.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-[14px]">
            No successful payments or receipts found in your history log.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-outline-variant/40 text-on-surface-variant font-eyebrow text-eyebrow uppercase tracking-wider">
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Student (Ward)</th>
                  <th className="p-3">Fee Particulars</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {successfulTxns.map((tx) => (
                  <tr key={tx.id} className="border-b border-outline-variant/20">
                    <td className={`p-3 font-bold font-mono text-[13px] ${tx.status === 'reversed' ? 'text-error' : 'text-ink-black'}`}>
                      {tx.receiptNumber}
                    </td>
                    <td className="p-3 text-on-surface-variant">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 font-medium text-ink-black">{tx.student.name}</td>
                    <td className="p-3 text-on-surface-variant">{tx.feeAssignment.feeStructure.name}</td>
                    <td className="p-3">
                      <StatusBadge tone={tx.status === 'reversed' ? 'error' : 'outline'}>{tx.method}</StatusBadge>
                    </td>
                    <td className={`p-3 font-bold ${tx.status === 'reversed' ? 'text-error' : 'text-success'}`}>
                      {tx.status === 'reversed' ? '-' : ''}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-3 h-9 rounded-full border border-outline-variant text-ink-black text-[13px] hover:bg-surface-container-low transition-colors"
                          onClick={() => handleDownloadReceipt(tx.id, tx.receiptNumber)}
                        >
                          <Icon name="download" className="text-[16px]" /> PDF
                        </button>
                        {tx.status === 'success' && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-3 h-9 rounded-full border border-error text-error text-[13px] hover:bg-error-container/40 transition-colors"
                            onClick={() => handleRequestRefund(tx)}
                          >
                            <Icon name="replay" className="text-[16px]" /> Refund
                          </button>
                        )}
                        {tx.status === 'reversed' && (
                          <span className="text-[13px] text-error italic flex items-center">Refunded</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
