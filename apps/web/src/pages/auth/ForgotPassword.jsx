import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Icon } from '../../components/Icon';
import GlassCard from '../../components/ui/GlassCard';
import ActionButton from '../../components/ui/ActionButton';

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
    } catch (err) {}
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
    } catch (err) {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8f6f3' }}>
      <GlassCard className="w-full max-w-[460px]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-ink-black rounded-xl flex items-center justify-center">
            <Icon name="account_balance" className="text-white text-[20px]" />
          </div>
          <span className="font-semibold text-xl text-ink-black">SmartSchool</span>
        </div>

        <p className="text-xs font-medium text-module-dashboard uppercase tracking-wider mb-1">Account Recovery</p>
        <h1 className="text-2xl font-semibold text-ink-black mb-6">
          {step === 1 ? 'Reset Password' : 'Set New Password'}
        </h1>

        {error && (
          <div className="p-4 rounded-[12px] bg-error-container text-error text-sm mb-4">{error}</div>
        )}
        {successMessage && (
          <div className="p-4 rounded-[12px] bg-success-container text-success text-sm mb-4">{successMessage}</div>
        )}

        {step === 1 ? (
          <form onSubmit={handleMobileSubmit} className="flex flex-col gap-5" noValidate>
            <p className="text-sm text-on-surface-variant">
              Enter your registered mobile number and we will send an OTP to reset your password.
            </p>
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Mobile Number</label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                value={mobile}
                maxLength={10}
                onChange={(e) => { setMobile(e.target.value); setFormErrors({}); }}
                className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
              />
              {formErrors.mobile && <span className="text-error text-xs mt-1 block">{formErrors.mobile}</span>}
            </div>
            <ActionButton type="submit" disabled={loading}>
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </ActionButton>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-5" noValidate>
            <p className="text-sm text-on-surface-variant">
              OTP sent to <strong className="text-ink-black">{tempMobile}</strong>.
            </p>
            {receivedOtp && (
              <div className="bg-success-container text-success rounded-[12px] p-4 text-center text-sm">
                <span className="text-xs">Dev helper — Mock SMS OTP</span>
                <p className="text-xl font-semibold tracking-[0.3em] mt-1">{receivedOtp}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">6-Digit OTP</label>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="e.g. 123456"
                value={otp}
                maxLength={6}
                onChange={(e) => { setOtp(e.target.value); setFormErrors({ ...formErrors, otp: null }); }}
                className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
              />
              {formErrors.otp && <span className="text-error text-xs mt-1 block">{formErrors.otp}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setFormErrors({ ...formErrors, newPassword: null }); }}
                className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
              />
              {formErrors.newPassword && <span className="text-error text-xs mt-1 block">{formErrors.newPassword}</span>}
            </div>
            <ActionButton type="submit" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </ActionButton>
          </form>
        )}

        <p className="text-center mt-8 text-sm text-on-surface-variant">
          Back to{' '}
          <button type="button" onClick={() => { useAuthStore.setState({ tempMobile: null }); onNavigate('login'); }} className="text-ink-black font-medium underline underline-offset-4 hover:text-module-dashboard transition-colors">
            Log In
          </button>
        </p>
      </GlassCard>
    </div>
  );
}
