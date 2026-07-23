import React from 'react';
import { Card, StatusBadge, Eyebrow } from '../ui/Primitives';

export default function WardsPanel({ students, onConsentToggle }) {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <Eyebrow>My Wards</Eyebrow>
        <h1 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight mt-2">
          Linked Students
        </h1>
        <p className="font-body text-[14px] text-on-surface-variant mt-2">
          Under the Digital Personal Data Protection (DPDP) Act 2023, you must explicitly consent to the collection and processing of your minor ward's educational and payment data.
        </p>
      </header>

      {students.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-on-surface-variant text-[14px]">
            No students registered under your guardian account.
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {students.map(student => (
            <Card key={student.id} className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-ink-black mb-1">{student.name}</h3>
                <p className="font-body text-[13px] text-on-surface-variant">
                  Class: {student.class} | ID: {student.id} | DOB: {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                </p>
                {student.consentChecked ? (
                  <p className="font-body text-[12px] text-success mt-2">
                    ✓ DPDP Consent Recorded: {new Date(student.consentTimestamp).toLocaleString()}
                  </p>
                ) : (
                  <p className="font-body text-[12px] text-error mt-2">
                    ⚠ DPDP Consent Required: Please check the box on the right to authorize data processing.
                  </p>
                )}

                {student.status === 'pending' && student.ocrFlagged && (
                  <p className="font-body text-[12px] text-error mt-1 font-medium">
                    ⚠ Document mismatch flagged. Awaiting Administrative verification override.
                  </p>
                )}
                {student.status === 'pending' && !student.ocrFlagged && (
                  <p className="font-body text-[12px] text-light-signal-orange mt-1">
                    ⏳ Awaiting manual Admin verification approval.
                  </p>
                )}
                {student.status === 'active' && (
                  <p className="font-body text-[12px] text-success mt-1 font-medium">
                    ✓ Account verified and fully active.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-5">
                <StatusBadge tone={student.status === 'active' ? 'active' : 'pending'} className="capitalize">
                  {student.status}
                </StatusBadge>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[var(--color-signal-orange)]"
                    checked={student.consentChecked}
                    onChange={(e) => onConsentToggle(student.id, e.target.checked)}
                  />
                  <span className="font-body text-body text-ink-black">Grant DPDP Consent</span>
                </label>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
