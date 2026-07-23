import React, { useState } from 'react';
import { Card, PillButton, InputField, Alert } from '../../components/ui/Primitives';

export default function Stage2KYC({ studentId, onSuccess, onCancel }) {
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [passbookFile, setPassbookFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!bankAccount || !ifsc) {
      setError('Please fill in both Bank Account and IFSC fields.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Create passbook URL (fake passbook url for simulation)
      const fakePhotoUrl = passbookFile
        ? `/uploads/passbook-${studentId}-${Date.now()}.jpg`
        : '/uploads/default-passbook.jpg';

      const res = await fetch('/api/students/kyc/stage2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: studentId,
          bank_account: bankAccount,
          ifsc,
          passbook_photo_url: fakePhotoUrl
        })
      });

      const data = await res.json();
      if (res.status === 200) {
        setSuccess('Banking details submitted successfully! Stage 2 KYC is complete.');
        if (onSuccess) {
          setTimeout(() => onSuccess(data.kycRecord), 2000);
        }
      } else {
        setError(data.error || 'Failed to submit banking details.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-card-padding">
        <h2 className="font-headline-sm text-headline-sm text-ink-black mb-2">Stage 2 KYC: Banking Details</h2>
        <p className="font-body text-[14px] text-on-surface-variant mb-6">
          Under DPDP guidelines, banking details are collected only when a refund is requested. They are encrypted at rest for security.
        </p>

        <Alert tone="error">{error}</Alert>
        <Alert tone="success">{success}</Alert>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
          <InputField
            label="Bank Account Number"
            id="kyc-account"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            placeholder="e.g. 123456789012"
            required
          />

          <InputField
            label="IFSC Code"
            id="kyc-ifsc"
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value)}
            placeholder="e.g. SBIN0001234"
            required
            maxLength={11}
            className="uppercase"
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="kyc-passbook" className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider">
              Passbook Photo / Cancelled Cheque
            </label>
            <input
              id="kyc-passbook"
              type="file"
              onChange={(e) => setPassbookFile(e.target.files[0])}
              accept="image/*,.pdf"
              className="w-full h-12 px-4 rounded-full border border-outline-variant/50 bg-surface font-body text-body text-ink-black file:mr-4 file:border-0 file:bg-ink-black file:text-canvas-cream file:rounded-full file:px-4 file:h-9 file:font-nav-button file:text-nav-button"
            />
          </div>

          <div className="flex gap-3 mt-1">
            <PillButton type="submit" disabled={loading} className="flex-1">
              {loading ? 'Submitting…' : 'Submit Details'}
            </PillButton>
            {onCancel && (
              <PillButton type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </PillButton>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
}
