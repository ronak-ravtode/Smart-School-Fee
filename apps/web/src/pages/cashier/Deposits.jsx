import React, { useState, useEffect } from 'react';
import { Card, PillButton, InputField, Alert, Eyebrow, StatusBadge } from '../../components/ui/Primitives';

const statusTone = (status) =>
  status === 'cleared' ? 'active' : status === 'bounced' ? 'error' : 'pending';

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
    <div className="flex flex-col gap-section-sm max-w-[960px] mx-auto w-full">
      <header>
        <Eyebrow>Cheque Deposits</Eyebrow>
        <h1 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight mt-2">
          Cheque Lifecycle Manager
        </h1>
        <p className="font-body text-[14px] text-on-surface-variant mt-2">
          View registered cheques, submit them for clearing at the bank, and process bounces.
        </p>
      </header>

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{success}</Alert>

      {/* Bounce Dialog Overlay Form */}
      {bouncingId && (
        <Card>
          <h3 className="font-headline-sm text-headline-sm text-ink-black mb-4">Report Cheque Bounce</h3>
          <form onSubmit={handleBounceSubmit} className="flex flex-col gap-4">
            <InputField
              label="Reason for Bounce"
              id="bounce-reason"
              value={bounceReason}
              onChange={(e) => setBounceReason(e.target.value)}
              placeholder="e.g. Insufficient funds, signature mismatch"
              required
            />
            <div className="flex gap-3">
              <PillButton type="submit" className="bg-error hover:bg-error/90 text-white" disabled={loadingId !== null}>
                Confirm Bounce & Apply Penalty (₹500)
              </PillButton>
              <PillButton type="button" variant="outline" onClick={() => setBouncingId(null)}>
                Cancel
              </PillButton>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {cheques.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-[14px]">
            No cheques registered in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-outline-variant/40 text-on-surface-variant font-eyebrow text-eyebrow uppercase tracking-wider">
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
                  <tr key={cheque.id} className="border-b border-outline-variant/20">
                    <td className="p-3 font-medium text-ink-black">{cheque.transaction.student.name}</td>
                    <td className="p-3 text-ink-black">{cheque.bank}</td>
                    <td className="p-3 font-mono text-[12px] text-ink-black">{cheque.chequeNo}</td>
                    <td className="p-3 font-semibold text-ink-black">₹{Number(cheque.transaction.amount).toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <StatusBadge tone={statusTone(cheque.depositStatus)} className="capitalize">
                        {cheque.depositStatus.replace('_', ' ')}
                      </StatusBadge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center flex-wrap">
                        {cheque.depositStatus === 'deposit_pending' && (
                          <PillButton type="button" className="h-9 px-4" disabled={loadingId !== null} onClick={() => handleDeposit(cheque.id)}>
                            Mark Deposited
                          </PillButton>
                        )}

                        {cheque.depositStatus === 'bank_pending' && (
                          <>
                            <PillButton type="button" className="bg-success hover:bg-success/90 text-white h-9 px-4" disabled={loadingId !== null} onClick={() => handleClear(cheque.id)}>
                              Clear
                            </PillButton>
                            <PillButton type="button" className="bg-error hover:bg-error/90 text-white h-9 px-4" disabled={loadingId !== null} onClick={() => setBouncingId(cheque.id)}>
                              Bounce
                            </PillButton>
                          </>
                        )}

                        {cheque.depositStatus === 'cleared' && (
                          <span className="text-[13px] text-success">Completed</span>
                        )}
                        {cheque.depositStatus === 'bounced' && (
                          <span className="text-[13px] text-error">Bounced</span>
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
