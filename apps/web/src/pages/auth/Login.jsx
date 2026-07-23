import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Icon } from '../../components/Icon';
import GlassCard from '../../components/ui/GlassCard';
import ActionButton from '../../components/ui/ActionButton';

export default function Login({ onNavigate }) {
  const { login, verifyOtp, error, successMessage, loading, tempMobile, receivedOtp, clearAlerts } = useAuthStore();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    clearAlerts();
    setStep(tempMobile ? 2 : 1);
  }, [tempMobile]);

  const validatePasswordStep = () => {
    const errors = {};
    if (!/^[0-9]{10}$/.test(mobile)) errors.mobile = 'Mobile number must be exactly 10 digits';
    if (!password) errors.password = 'Password is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordStep()) return;
    try {
      await login(mobile, password);
    } catch (err) {}
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setFormErrors({ otp: 'OTP must be exactly 6 digits' });
      return;
    }
    try {
      await verifyOtp(otp);
      onNavigate('dashboard');
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

        <p className="text-xs font-medium text-module-dashboard uppercase tracking-wider mb-1">Secure Access</p>
        <h1 className="text-2xl font-semibold text-ink-black mb-6">
          {step === 1 ? 'Log In to Your Account' : 'Two-Factor Verification'}
        </h1>

        {error && (
          <div className="p-4 rounded-[12px] bg-error-container text-error text-sm mb-4">{error}</div>
        )}
        {successMessage && (
          <div className="p-4 rounded-[12px] bg-success-container text-success text-sm mb-4">{successMessage}</div>
        )}

        {step === 1 ? (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Mobile Number</label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                value={mobile}
                maxLength={10}
                onChange={(e) => { setMobile(e.target.value); setFormErrors({ ...formErrors, mobile: null }); }}
                className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
              />
              {formErrors.mobile && <span className="text-error text-xs mt-1 block">{formErrors.mobile}</span>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-ink-black">Password</label>
                <button type="button" onClick={() => onNavigate('forgot-password')} className="text-xs text-link-blue hover:underline">Forgot password?</button>
              </div>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFormErrors({ ...formErrors, password: null }); }}
                className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
              />
              {formErrors.password && <span className="text-error text-xs mt-1 block">{formErrors.password}</span>}
            </div>
            <ActionButton type="submit" disabled={loading}>
              {loading ? 'Verifying…' : 'Next Step'}
            </ActionButton>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5" noValidate>
            <p className="text-sm text-on-surface-variant">
              We sent a security code to <strong className="text-ink-black">{tempMobile}</strong>.
            </p>
            {receivedOtp && (
              <div className="bg-success-container text-success rounded-[12px] p-4 text-center text-sm">
                <span className="text-xs">Dev helper — Mock SMS OTP</span>
                <p className="text-xl font-semibold tracking-[0.3em] mt-1">{receivedOtp}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Enter 6-Digit OTP</label>
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
            <ActionButton type="submit" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify & Log In'}
            </ActionButton>
            <button
              type="button"
              className="text-sm text-on-surface-variant hover:text-ink-black transition-colors"
              onClick={() => { useAuthStore.setState({ tempMobile: null }); setStep(1); }}
            >
              Back to Password
            </button>
          </form>
        )}

        <p className="text-center mt-8 text-sm text-on-surface-variant">
          Don&rsquo;t have an account?{' '}
          <button type="button" onClick={() => onNavigate('signup')} className="text-ink-black font-medium underline underline-offset-4 hover:text-module-dashboard transition-colors">
            Sign Up
          </button>
        </p>
      </GlassCard>
    </div>
  );
}
