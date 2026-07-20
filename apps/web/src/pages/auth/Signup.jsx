import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import OCRUpload from '../../components/common/OCRUpload';
import axios from 'axios';
import { Icon } from '../../components/Icon';
import { InputField, SelectField, PillButton, Alert, Eyebrow } from '../../components/ui/Primitives';

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
    <div className="min-h-screen flex items-center justify-center px-margin-mobile py-section-sm">
      <div className="w-full max-w-[680px] bg-lifted-cream rounded-frame p-card-padding shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] border border-white/40 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 border-[1.5px] border-light-signal-orange/20 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-ink-black rounded-full flex items-center justify-center">
              <Icon name="account_balance" className="text-white text-[20px]" />
            </div>
            <span className="brand-mark text-[20px]">SmartSchool</span>
          </div>

          <Eyebrow>Stage 1: Identity &amp; Registration</Eyebrow>
          <h1 className="font-headline-sm text-headline-sm text-ink-black mt-2 mb-2">
            Create Your Account
          </h1>
          <p className="font-body text-body text-on-surface-variant mb-8">
            {formData.role === 'guardian'
              ? 'Set up parent credentials and scan your child’s ID document to verify details.'
              : 'Register a secure school management administrative account.'}
          </p>

          <Alert tone="error">{authError || apiError}</Alert>
          <Alert tone="success">{successMessage}</Alert>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <section className="flex flex-col gap-4 pb-6 border-b border-outline-variant/40">
              <span className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider">Account Credentials</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <InputField label="Full Name" id="signup-name" name="name" placeholder="Enter full name" value={formData.name} onChange={handleChange} />
                  {formErrors.name && <span className="text-error text-[13px] pl-4">{formErrors.name}</span>}
                </div>
                <div>
                  <InputField label="Email Address" id="signup-email" name="email" type="email" autoComplete="email" placeholder="name@mail.com" value={formData.email} onChange={handleChange} />
                  {formErrors.email && <span className="text-error text-[13px] pl-4">{formErrors.email}</span>}
                </div>
                <div>
                  <InputField label="Mobile Number" id="signup-mobile" name="mobile" type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit number" maxLength={10} value={formData.mobile} onChange={handleChange} />
                  {formErrors.mobile && <span className="text-error text-[13px] pl-4">{formErrors.mobile}</span>}
                </div>
                <div>
                  <InputField label="Password" id="signup-password" name="password" type="password" autoComplete="new-password" placeholder="Password" value={formData.password} onChange={handleChange} />
                  {formErrors.password && <span className="text-error text-[13px] pl-4">{formErrors.password}</span>}
                </div>
              </div>
              <div className="max-w-[240px]">
                <SelectField label="Registering As" id="signup-role" name="role" value={formData.role} onChange={handleChange}>
                  <option value="guardian">Guardian / Parent</option>
                  <option value="admin">School Admin</option>
                </SelectField>
              </div>
            </section>

            {formData.role === 'guardian' && (
              <section className="flex flex-col gap-4 pb-6 border-b border-outline-variant/40">
                <span className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider">Ward (Student) Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <InputField label="Student Name" id="student-name" name="name" placeholder="Child's full name" value={studentData.name} onChange={handleStudentChange} />
                    {formErrors.studentName && <span className="text-error text-[13px] pl-4">{formErrors.studentName}</span>}
                  </div>
                  <div>
                    <SelectField label="Academic Class" id="student-class" name="class" value={studentData.class} onChange={handleStudentChange}>
                      {CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </SelectField>
                  </div>
                  <div>
                    <InputField label="Date of Birth" id="student-dob" name="dob" type="date" value={studentData.dob} onChange={handleStudentChange} />
                    {formErrors.studentDob && <span className="text-error text-[13px] pl-4">{formErrors.studentDob}</span>}
                  </div>
                </div>

                <div>
                  <label className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider block mb-2">KYC Verification Document</label>
                  <div className="flex gap-6 mb-3">
                    <label className="flex items-center gap-2 font-body text-body text-ink-black cursor-pointer">
                      <input type="radio" name="docType" checked={docType === 'aadhaar'} onChange={() => setDocType('aadhaar')} className="accent-ink-black" />
                      Aadhaar Card
                    </label>
                    <label className="flex items-center gap-2 font-body text-body text-ink-black cursor-pointer">
                      <input type="radio" name="docType" checked={docType === 'birth_certificate'} onChange={() => setDocType('birth_certificate')} className="accent-ink-black" />
                      Birth Certificate
                    </label>
                  </div>
                </div>

                <OCRUpload docType={docType} onOCRComplete={handleOCRComplete} />
                {formErrors.ocr && <span className="text-error text-[13px]">{formErrors.ocr}</span>}

                {ocrWarning && (
                  <div className={`p-4 rounded-[20px] font-body text-[14px] ${warningTone === 'success' ? 'bg-success-container text-success' : 'bg-error-container text-on-error-container'}`}>
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
              <span className="font-body text-body text-on-surface-variant">
                <strong className="text-ink-black">DPDP Act 2023 Consent:</strong> I explicitly consent to the collection and processing of my ward&rsquo;s educational, financial, and personal minor data for school fee administration.
              </span>
            </label>

            <PillButton type="submit" disabled={!consentChecked || loading} iconRight="arrow_forward">
              {loading ? 'Processing Registration…' : 'Agree & Register Account'}
            </PillButton>
          </form>

          <p className="text-center mt-8 font-body text-body text-on-surface-variant">
            Already have an account?{' '}
            <button type="button" onClick={() => onNavigate('login')} className="text-ink-black font-medium underline underline-offset-4 hover:text-signal-orange transition-colors">
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
