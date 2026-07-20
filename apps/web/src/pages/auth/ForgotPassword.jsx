import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Icon } from '../../components/Icon';
import { InputField, PillButton, Alert, Eyebrow } from '../../components/ui/Primitives';

export default function ForgotPassword({ onNavigate }) {
  const { forgotPassword, resetPassword, error, successMessage, loading, tempMobile, receivedOtp, clearAlerts } = useAuthStore();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    clearAlerts();
    setStep(tempMobile ? 2 : 1);
  }, [tempMobile]);

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(mobile)) {
      setFormErrors({ mobile: 'Enter a valid 10-digit mobile number' });
      return;
    }
    try {
      await forgotPassword(mobile);
    } catch (err) {
      /* handled by store */
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (otp.length !== 6) errors.otp = 'OTP must be exactly 6 digits';
    if (newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    try {
      await resetPassword(otp, newPassword);
      setTimeout(() => {
        useAuthStore.setState({ tempMobile: null });
        onNavigate('login');
      }, 1500);
    } catch (err) {
      /* handled by store */
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-margin-mobile py-section-sm">
      <div className="w-full max-w-[460px] bg-lifted-cream rounded-frame p-card-padding shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] border border-white/40 relative overflow-hidden">
        <div className="absolute -left-16 -bottom-16 w-48 h-48 border-[1.5px] border-light-signal-orange/20 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-ink-black rounded-full flex items-center justify-center">
              <Icon name="account_balance" className="text-white text-[20px]" />
            </div>
            <span className="brand-mark text-[20px]">SmartSchool</span>
          </div>

          <Eyebrow>Account Recovery</Eyebrow>
          <h1 className="font-headline-sm text-headline-sm text-ink-black mt-2 mb-8">
            {step === 1 ? 'Reset Password' : 'Set New Password'}
          </h1>

          <Alert tone="error">{error}</Alert>
          <Alert tone="success">{successMessage}</Alert>

          {step === 1 ? (
            <form onSubmit={handleMobileSubmit} className="flex flex-col gap-6" noValidate>
              <p className="font-body text-body text-on-surface-variant">
                Enter your registered mobile number and we will send an OTP to reset your password.
              </p>
              <div>
                <InputField
                  label="Mobile Number"
                  id="forgot-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  maxLength={10}
                  onChange={(e) => { setMobile(e.target.value); setFormErrors({}); }}
                />
                {formErrors.mobile && <span className="text-error text-[13px] pl-4">{formErrors.mobile}</span>}
              </div>
              <PillButton type="submit" disabled={loading} iconRight="arrow_forward">
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </PillButton>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="flex flex-col gap-6" noValidate>
              <p className="font-body text-body text-on-surface-variant">
                OTP sent to <strong className="text-ink-black">{tempMobile}</strong>.
              </p>
              {receivedOtp && (
                <div className="bg-success-container text-success rounded-[20px] p-4 text-center font-body">
                  <span className="text-[13px]">Dev helper — Mock SMS OTP</span>
                  <p className="font-headline-sm text-headline-sm tracking-[0.3em] mt-1">{receivedOtp}</p>
                </div>
              )}
              <div>
                <InputField
                  label="6-Digit OTP"
                  id="forgot-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="e.g. 123456"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => { setOtp(e.target.value); setFormErrors({ ...formErrors, otp: null }); }}
                />
                {formErrors.otp && <span className="text-error text-[13px] pl-4">{formErrors.otp}</span>}
              </div>
              <div>
                <InputField
                  label="New Password"
                  id="forgot-new"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setFormErrors({ ...formErrors, newPassword: null }); }}
                />
                {formErrors.newPassword && <span className="text-error text-[13px] pl-4">{formErrors.newPassword}</span>}
              </div>
              <PillButton type="submit" disabled={loading} iconRight="arrow_forward">
                {loading ? 'Resetting…' : 'Reset Password'}
              </PillButton>
            </form>
          )}

          <p className="text-center mt-8 font-body text-body text-on-surface-variant">
            Back to{' '}
            <button type="button" onClick={() => { useAuthStore.setState({ tempMobile: null }); onNavigate('login'); }} className="text-ink-black font-medium underline underline-offset-4 hover:text-signal-orange transition-colors">
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
