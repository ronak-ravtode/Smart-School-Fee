import React, { useState } from 'react';
import { Card, PillButton, Alert, Eyebrow, StatusBadge } from '../../components/ui/Primitives';

export default function Reconciliation() {
  const [csvText, setCsvText] = useState('');
  const [matched, setMatched] = useState([]);
  const [unmatched, setUnmatched] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleReconcile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setMatched([]);
    setUnmatched([]);

    if (!csvText.trim()) {
      setError('Please paste CSV text or upload a CSV file.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/reconciliation/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ csvText })
      });

      const data = await res.json();
      if (res.status === 200) {
        setMatched(data.matched);
        setUnmatched(data.unmatched);
        setSuccess(`Reconciliation process finished! Auto-matched ${data.matched.length} deposits. Flagged ${data.unmatched.length} unmatched entries.`);
      } else {
        setError(data.error || 'Reconciliation failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-section-sm">
      <header>
        <Eyebrow>Bank Reconciliation</Eyebrow>
        <h1 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight mt-2">
          Statement Matching
        </h1>
      </header>

      {/* Upload/Paste Form */}
      <Card>
        <h2 className="font-headline-sm text-headline-sm text-ink-black mb-2">Bank Statement Reconciliation</h2>
        <p className="font-body text-[14px] text-on-surface-variant mb-6">
          Upload your bank statement spreadsheet or copy-paste CSV records to auto-match deposits with cashier records.
        </p>

        <Alert tone="error">{error}</Alert>
        <Alert tone="success">{success}</Alert>

        <form onSubmit={handleReconcile} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="csv-file" className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider">
              Upload Statement File (CSV)
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full h-12 px-4 rounded-full border border-outline-variant/50 bg-surface font-body text-body text-ink-black file:mr-4 file:border-0 file:bg-ink-black file:text-canvas-cream file:rounded-full file:px-4 file:h-9 file:font-nav-button file:text-nav-button"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="csv-text" className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider">
              Or Paste CSV Data (Format: date,amount)
            </label>
            <textarea
              id="csv-text"
              className="w-full p-4 rounded-[20px] border border-outline-variant/50 bg-surface focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black font-mono text-[13px] text-ink-black resize-y"
              rows={5}
              placeholder={"date,amount\n2026-07-18,25000\n2026-07-18,65000"}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
          </div>

          <PillButton type="submit" disabled={loading} className="mt-1">
            {loading ? 'Processing Bank Statement…' : 'Reconcile Statement'}
          </PillButton>
        </form>
      </Card>

      {/* Results Section */}
      {(matched.length > 0 || unmatched.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Matched Panel */}
          <Card>
            <h3 className="font-headline-sm text-headline-sm text-success mb-4">Matched Deposits ({matched.length})</h3>
            <div className="overflow-x-auto">
              {matched.length === 0 ? (
                <div className="text-on-surface-variant text-[13px] py-6">No matches found.</div>
              ) : (
                <table className="w-full border-collapse text-[13px] text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/40 text-on-surface-variant font-eyebrow text-eyebrow uppercase tracking-wider">
                      <th className="p-2">Date</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Student</th>
                      <th className="p-2">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matched.map((row, idx) => (
                      <tr key={idx} className="border-b border-outline-variant/20">
                        <td className="p-2 text-ink-black">{row.date}</td>
                        <td className="p-2 font-semibold text-ink-black">₹{row.amount.toLocaleString()}</td>
                        <td className="p-2 text-on-surface-variant">{row.studentName}</td>
                        <td className="p-2 font-mono text-[12px] text-on-surface-variant">{row.receiptNumber || 'Pending'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {/* Unmatched Panel */}
          <Card>
            <h3 className="font-headline-sm text-headline-sm text-error mb-4">Unmatched Statement Rows ({unmatched.length})</h3>
            <div className="overflow-x-auto">
              {unmatched.length === 0 ? (
                <div className="text-on-surface-variant text-[13px] py-6">No unmatched rows! Balance is fully cleared.</div>
              ) : (
                <table className="w-full border-collapse text-[13px] text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/40 text-on-surface-variant font-eyebrow text-eyebrow uppercase tracking-wider">
                      <th className="p-2">Date</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unmatched.map((row, idx) => (
                      <tr key={idx} className="border-b border-outline-variant/20">
                        <td className="p-2 text-ink-black">{row.date}</td>
                        <td className="p-2 font-semibold text-ink-black">₹{Number(row.amount).toLocaleString()}</td>
                        <td className="p-2">
                          <StatusBadge tone="unmatched">Unmatched</StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
