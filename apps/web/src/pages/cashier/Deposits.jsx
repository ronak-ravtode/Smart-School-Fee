import React, { useState, useEffect } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import ActionButton from '../../components/ui/ActionButton';
import PageHeader from '../../components/ui/PageHeader';
import StatusChip from '../../components/ui/StatusChip';

const statusTone = (status) =>
  status === 'cleared' ? 'success' : status === 'bounced' ? 'error' : 'pending';

export default function Deposits() {
  const [cheques, setCheques] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [bounceReason, setBounceReason] = useState('');
  const [bouncingId, setBouncingId] = useState(null);

  const fetchCheques = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cheques', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.status === 200) {
        setCheques(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch cheque records.');
    }
  };

  useEffect(() => {
    fetchCheques();
  }, []);

  const handleDeposit = async (id) => {
    setLoadingId(id);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cheques/${id}/deposit`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 200) {
        setSuccess('Cheque marked as deposited at the bank.');
        fetchCheques();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to deposit cheque.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleClear = async (id) => {
    setLoadingId(id);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cheques/${id}/clear`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 200) {
        setSuccess('Cheque successfully cleared! Receipt has been generated.');
        fetchCheques();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to clear cheque.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleBounceSubmit = async (e) => {
    e.preventDefault();
    if (!bouncingId) return;

    setLoadingId(bouncingId);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cheques/${bouncingId}/bounce`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bounce_reason: bounceReason })
      });
      if (res.status === 200) {
        setSuccess('Cheque marked as bounced. Reopened fee assignment and applied ₹500 penalty.');
        setBounceReason('');
        setBouncingId(null);
        fetchCheques();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to bounce cheque.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-[960px] mx-auto w-full">
      <PageHeader
        eyebrow="Cheque Deposits"
        title="Cheque Lifecycle Manager"
        subtitle="View registered cheques, submit them for clearing at the bank, and process bounces."
      />

      {error && <div className="p-4 rounded-[12px] bg-error-container text-error text-sm mb-4">{error}</div>}
      {success && <div className="p-4 rounded-[12px] bg-success-container text-success text-sm mb-4">{success}</div>}

      {bouncingId && (
        <GlassCard className="mb-6">
          <h3 className="font-medium text-ink-black mb-4">Report Cheque Bounce</h3>
          <form onSubmit={handleBounceSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Reason for Bounce</label>
              <input
                value={bounceReason}
                onChange={(e) => setBounceReason(e.target.value)}
                placeholder="e.g. Insufficient funds, signature mismatch"
                required
                className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-reconciliation/30 focus:border-module-reconciliation transition-all"
              />
            </div>
            <div className="flex gap-3">
              <ActionButton type="submit" disabled={loadingId !== null}>
                Confirm Bounce & Apply Penalty (₹500)
              </ActionButton>
              <ActionButton variant="secondary" type="button" onClick={() => setBouncingId(null)}>
                Cancel
              </ActionButton>
            </div>
          </form>
        </GlassCard>
      )}

      <GlassCard>
        {cheques.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-sm">
            No cheques registered in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="p-3">Student</th>
                  <th className="p-3">Bank</th>
                  <th className="p-3">Cheque No.</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Deposit Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cheques.map(cheque => (
                  <tr key={cheque.id} className="border-b border-gray-100">
                    <td className="p-3 font-medium text-ink-black">{cheque.transaction.student.name}</td>
                    <td className="p-3 text-ink-black">{cheque.bank}</td>
                    <td className="p-3 font-mono text-xs text-ink-black">{cheque.chequeNo}</td>
                    <td className="p-3 font-semibold text-ink-black">₹{Number(cheque.transaction.amount).toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <StatusChip variant={statusTone(cheque.depositStatus)} className="capitalize">
                        {cheque.depositStatus.replace('_', ' ')}
                      </StatusChip>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center flex-wrap">
                        {cheque.depositStatus === 'deposit_pending' && (
                          <ActionButton variant="ghost" disabled={loadingId !== null} onClick={() => handleDeposit(cheque.id)}>
                            Mark Deposited
                          </ActionButton>
                        )}

                        {cheque.depositStatus === 'bank_pending' && (
                          <>
                            <ActionButton variant="ghost" disabled={loadingId !== null} onClick={() => handleClear(cheque.id)}>
                              Clear
                            </ActionButton>
                            <ActionButton variant="ghost" disabled={loadingId !== null} onClick={() => setBouncingId(cheque.id)}>
                              Bounce
                            </ActionButton>
                          </>
                        )}

                        {cheque.depositStatus === 'cleared' && (
                          <span className="text-sm text-success">Completed</span>
                        )}
                        {cheque.depositStatus === 'bounced' && (
                          <span className="text-sm text-error">Bounced</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
