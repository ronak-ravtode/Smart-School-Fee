import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import OCRUpload from '../../components/common/OCRUpload';
import axios from 'axios';
import { Icon } from '../../components/Icon';
import GlassCard from '../../components/ui/GlassCard';
import ActionButton from '../../components/ui/ActionButton';

const CLASSES = ['Grade 1-A', 'Grade 2-C', 'Grade 5-A', 'Grade 10-B'];

export default function Signup({ onNavigate }) {
  const { error: authError, successMessage, loading, clearAlerts } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'guardian',
  });

  const [studentData, setStudentData] = useState({
    name: '',
    class: 'Grade 5-A',
    dob: '',
  });

  const [docType, setDocType] = useState('aadhaar');
  const [ocrData, setOcrData] = useState(null);
  const [ocrWarning, setOcrWarning] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    clearAlerts();
    setApiError(null);
  }, []);

  useEffect(() => {
    if (!ocrData || formData.role !== 'guardian') {
      setOcrWarning('');
      return;
    }
    let nameMismatched = false;
    if (ocrData.name && studentData.name) {
      const getWords = (str) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2);
      const w1 = getWords(ocrData.name);
      const w2 = getWords(studentData.name);
      if (w1.length > 0 && w2.length > 0) {
        const [short, long] = w1.length < w2.length ? [w1, w2] : [w2, w1];
        const matches = short.filter((w) => long.includes(w));
        nameMismatched = matches.length !== short.length;
      } else {
        nameMismatched = ocrData.name.toLowerCase().replace(/[^a-z0-9]/g, '') !== studentData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
    }
    let dobMismatched = false;
    if (ocrData.dob && studentData.dob) {
      try {
        dobMismatched = new Date(ocrData.dob).toDateString() !== new Date(studentData.dob).toDateString();
      } catch (e) {
        dobMismatched = true;
      }
    }
    if (nameMismatched && dobMismatched) {
      setOcrWarning('Name & DOB mismatch: Document data differs from your input. Admin verification will be required.');
    } else if (nameMismatched) {
      setOcrWarning(`Name mismatch: Document says "${ocrData.name}". Admin verification will be required.`);
    } else if (dobMismatched) {
      setOcrWarning(`DOB mismatch: Document says "${ocrData.dob}". Admin verification will be required.`);
    } else {
      setOcrWarning('Document details verified and matched successfully.');
    }
  }, [studentData.name, studentData.dob, ocrData, formData.role]);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Guardian name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Enter a valid email address';
    if (!/^[0-9]{10}$/.test(formData.mobile)) errors.mobile = 'Mobile number must be exactly 10 digits';
    if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (formData.role === 'guardian') {
      if (!studentData.name.trim()) errors.studentName = 'Student name is required';
      if (!studentData.dob) errors.studentDob = 'Student date of birth is required';
      if (!ocrData) errors.ocr = 'Please scan your Aadhaar or Birth Certificate to complete Stage 1';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) setFormErrors({ ...formErrors, [e.target.name]: null });
  };

  const handleStudentChange = (e) => {
    setStudentData({ ...studentData, [e.target.name]: e.target.value });
    const key = `student${e.target.name.charAt(0).toUpperCase() + e.target.name.slice(1)}`;
    if (formErrors[key]) setFormErrors({ ...formErrors, [key]: null });
  };

  const handleOCRComplete = (data) => {
    setOcrData(data);
    if (formErrors.ocr) setFormErrors({ ...formErrors, ocr: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    if (!consentChecked) return;
    try {
      const signupPayload = {
        ...formData,
        studentName: formData.role === 'guardian' ? studentData.name : undefined,
        studentClass: formData.role === 'guardian' ? studentData.class : undefined,
        studentDob: formData.role === 'guardian' ? studentData.dob : undefined,
      };
      const res = await axios.post('/api/auth/signup', signupPayload);
      const { user, token, student } = res.data;
      useAuthStore.setState({ token, user });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (formData.role === 'guardian' && student) {
        let maskedDocRef = null;
        if (ocrData.docRef) {
          const cleanRef = ocrData.docRef.replace(/\s/g, '');
          maskedDocRef = cleanRef.length >= 4 ? `**** **** ${cleanRef.slice(-4)}` : cleanRef;
        }
        await axios.post(
          '/api/students/kyc',
          {
            studentId: student.id,
            docType,
            docRef: maskedDocRef,
            ocrData: { name: ocrData.name, dob: ocrData.dob, rawText: ocrData.rawText },
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setTimeout(() => onNavigate('dashboard'), 1000);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Signup registration failed.');
    }
  };

  const warningTone = ocrWarning.startsWith('Document details verified') ? 'success' : 'error';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8f6f3' }}>
      <GlassCard className="w-full max-w-[680px]" noPadding>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-ink-black rounded-xl flex items-center justify-center">
              <Icon name="account_balance" className="text-white text-[20px]" />
            </div>
            <span className="font-semibold text-xl text-ink-black">SmartSchool</span>
          </div>

          <p className="text-xs font-medium text-module-dashboard uppercase tracking-wider mb-1">Stage 1: Identity & Registration</p>
          <h1 className="text-2xl font-semibold text-ink-black mb-2">Create Your Account</h1>
          <p className="text-sm text-on-surface-variant mb-8">
            {formData.role === 'guardian'
              ? 'Set up parent credentials and scan your child\'s ID document to verify details.'
              : 'Register a secure school management administrative account.'}
          </p>

          {(authError || apiError) && (
            <div className="p-4 rounded-[12px] bg-error-container text-error text-sm mb-4">{authError || apiError}</div>
          )}
          {successMessage && (
            <div className="p-4 rounded-[12px] bg-success-container text-success text-sm mb-4">{successMessage}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <section className="flex flex-col gap-4 pb-6 border-b border-gray-200">
              <span className="text-xs font-medium text-module-dashboard uppercase tracking-wider">Account Credentials</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-black mb-1">Full Name</label>
                  <input name="name" placeholder="Enter full name" value={formData.name} onChange={handleChange} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all" />
                  {formErrors.name && <span className="text-error text-xs mt-1 block">{formErrors.name}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-black mb-1">Email Address</label>
                  <input name="email" type="email" autoComplete="email" placeholder="name@mail.com" value={formData.email} onChange={handleChange} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all" />
                  {formErrors.email && <span className="text-error text-xs mt-1 block">{formErrors.email}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-black mb-1">Mobile Number</label>
                  <input name="mobile" type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit number" maxLength={10} value={formData.mobile} onChange={handleChange} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all" />
                  {formErrors.mobile && <span className="text-error text-xs mt-1 block">{formErrors.mobile}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-black mb-1">Password</label>
                  <input name="password" type="password" autoComplete="new-password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all" />
                  {formErrors.password && <span className="text-error text-xs mt-1 block">{formErrors.password}</span>}
                </div>
              </div>
              <div className="max-w-[240px]">
                <label className="block text-sm font-medium text-ink-black mb-1">Registering As</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all">
                  <option value="guardian">Guardian / Parent</option>
                  <option value="admin">School Admin</option>
                </select>
              </div>
            </section>

            {formData.role === 'guardian' && (
              <section className="flex flex-col gap-4 pb-6 border-b border-gray-200">
                <span className="text-xs font-medium text-module-dashboard uppercase tracking-wider">Ward (Student) Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-black mb-1">Student Name</label>
                    <input name="name" placeholder="Child's full name" value={studentData.name} onChange={handleStudentChange} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all" />
                    {formErrors.studentName && <span className="text-error text-xs mt-1 block">{formErrors.studentName}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-black mb-1">Academic Class</label>
                    <select name="class" value={studentData.class} onChange={handleStudentChange} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all">
                      {CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-black mb-1">Date of Birth</label>
                    <input name="dob" type="date" value={studentData.dob} onChange={handleStudentChange} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all" />
                    {formErrors.studentDob && <span className="text-error text-xs mt-1 block">{formErrors.studentDob}</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-black mb-2">KYC Verification Document</label>
                  <div className="flex gap-6 mb-3">
                    <label className="flex items-center gap-2 text-sm text-ink-black cursor-pointer">
                      <input type="radio" name="docType" checked={docType === 'aadhaar'} onChange={() => setDocType('aadhaar')} className="accent-ink-black" />
                      Aadhaar Card
                    </label>
                    <label className="flex items-center gap-2 text-sm text-ink-black cursor-pointer">
                      <input type="radio" name="docType" checked={docType === 'birth_certificate'} onChange={() => setDocType('birth_certificate')} className="accent-ink-black" />
                      Birth Certificate
                    </label>
                  </div>
                </div>

                <OCRUpload docType={docType} onOCRComplete={handleOCRComplete} />
                {formErrors.ocr && <span className="text-error text-xs">{formErrors.ocr}</span>}

                {ocrWarning && (
                  <div className={`p-4 rounded-[12px] text-sm ${warningTone === 'success' ? 'bg-success-container text-success' : 'bg-error-container text-on-error-container'}`}>
                    {ocrWarning}
                  </div>
                )}
              </section>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 w-5 h-5 rounded accent-ink-black"
              />
              <span className="text-sm text-on-surface-variant">
                <strong className="text-ink-black">DPDP Act 2023 Consent:</strong> I explicitly consent to the collection and processing of my ward&rsquo;s educational, financial, and personal minor data for school fee administration.
              </span>
            </label>

            <ActionButton type="submit" disabled={!consentChecked || loading}>
              {loading ? 'Processing Registration…' : 'Agree & Register Account'}
            </ActionButton>
          </form>

          <p className="text-center mt-8 text-sm text-on-surface-variant">
            Already have an account?{' '}
            <button type="button" onClick={() => onNavigate('login')} className="text-ink-black font-medium underline underline-offset-4 hover:text-module-dashboard transition-colors">
              Log In
            </button>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
