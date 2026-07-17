import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Receipts() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get('/api/payments/transactions');
        setTransactions(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load transaction history ledger.');
      } finally {
        setLoading(false);
      }
    };
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

  // Filter out pending/failed transactions for receipt list (only show success or cleared)
  const successfulTxns = transactions.filter(t => t.status === 'success');

  return (
    <div className="glass-panel" style={{ padding: '40px' }}>
      <div style={{ marginBottom: '25px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Receipt History & Ledger</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
          Access your digital billing ledger and download official signed PDF receipts for all educational fee payments.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Loading transaction receipts...
        </div>
      ) : successfulTxns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '45px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No successful payments or receipts found in your history log.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '15px' }}>Receipt No</th>
                <th style={{ padding: '15px' }}>Date</th>
                <th style={{ padding: '15px' }}>Student (Ward)</th>
                <th style={{ padding: '15px' }}>Fee Particulars</th>
                <th style={{ padding: '15px' }}>Method</th>
                <th style={{ padding: '15px' }}>Amount Paid</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {successfulTxns.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '15px', fontWeight: '700', color: 'var(--secondary)', fontFamily: 'monospace' }}>
                    {tx.receiptNumber}
                  </td>
                  <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '15px', fontWeight: 500 }}>{tx.student.name}</td>
                  <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>
                    {tx.feeAssignment.feeStructure.name}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                      {tx.method}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 700, color: 'var(--success)' }}>
                    ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      onClick={() => handleDownloadReceipt(tx.id, tx.receiptNumber)}
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
