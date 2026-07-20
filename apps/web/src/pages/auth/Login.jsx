import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Icon } from '../../components/Icon';
import { InputField, PillButton, Alert, Eyebrow } from '../../components/ui/Primitives';

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
    } catch (err) {
      /* handled by store */
    }
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
    } catch (err) {
      /* handled by store */
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-margin-mobile py-section-sm">
      <div className="w-full max-w-[460px] bg-lifted-cream rounded-frame p-card-padding shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] border border-white/40 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 border-[1.5px] border-light-signal-orange/20 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-ink-black rounded-full flex items-center justify-center">
              <Icon name="account_balance" className="text-white text-[20px]" />
            </div>
            <span className="brand-mark text-[20px]">SmartSchool</span>
          </div>

          <Eyebrow>Secure Access</Eyebrow>
          <h1 className="font-headline-sm text-headline-sm text-ink-black mt-2 mb-8">
            {step === 1 ? 'Log In to Your Account' : 'Two-Factor Verification'}
          </h1>

          <Alert tone="error">{error}</Alert>
          <Alert tone="success">{successMessage}</Alert>

          {step === 1 ? (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6" noValidate>
              <div>
                <InputField
                  label="Mobile Number"
                  id="login-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  maxLength={10}
                  onChange={(e) => { setMobile(e.target.value); setFormErrors({ ...formErrors, mobile: null }); }}
                />
                {formErrors.mobile && <span className="text-error text-[13px] pl-4">{formErrors.mobile}</span>}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider">Password</label>
                  <button type="button" onClick={() => onNavigate('forgot-password')} className="font-nav-button text-nav-button text-link-blue hover:underline text-[14px]">Forgot password?</button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full h-12 px-4 mt-2 rounded-full border border-outline-variant/50 bg-surface focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black font-body text-body text-ink-black transition-all"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFormErrors({ ...formErrors, password: null }); }}
                />
                {formErrors.password && <span className="text-error text-[13px] pl-4">{formErrors.password}</span>}
              </div>
              <PillButton type="submit" disabled={loading} iconRight="arrow_forward">
                {loading ? 'Verifying…' : 'Next Step'}
              </PillButton>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-6" noValidate>
              <p className="font-body text-body text-on-surface-variant">
                We sent a security code to <strong className="text-ink-black">{tempMobile}</strong>.
              </p>
              {receivedOtp && (
                <div className="bg-success-container text-success rounded-[20px] p-4 text-center font-body">
                  <span className="text-[13px]">Dev helper — Mock SMS OTP</span>
                  <p className="font-headline-sm text-headline-sm tracking-[0.3em] mt-1">{receivedOtp}</p>
                </div>
              )}
              <div>
                <InputField
                  label="Enter 6-Digit OTP"
                  id="login-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="e.g. 123456"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => { setOtp(e.target.value); setFormErrors({ ...formErrors, otp: null }); }}
                />
                {formErrors.otp && <span className="text-error text-[13px] pl-4">{formErrors.otp}</span>}
              </div>
              <PillButton type="submit" disabled={loading} iconRight="arrow_forward">
                {loading ? 'Verifying…' : 'Verify & Log In'}
              </PillButton>
              <button
                type="button"
                className="font-nav-button text-nav-button text-on-surface-variant hover:text-ink-black transition-colors"
                onClick={() => { useAuthStore.setState({ tempMobile: null }); setStep(1); }}
              >
                Back to Password
              </button>
            </form>
          )}

          <p className="text-center mt-8 font-body text-body text-on-surface-variant">
            Don&rsquo;t have an account?{' '}
            <button type="button" onClick={() => onNavigate('signup')} className="text-ink-black font-medium underline underline-offset-4 hover:text-signal-orange transition-colors">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
