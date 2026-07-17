import React, { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import FeeSetup from './pages/admin/FeeSetup';
import Approvals from './pages/admin/Approvals';
import Payment from './pages/guardian/Payment';
import PaymentSuccess from './pages/guardian/PaymentSuccess';
import Receipts from './pages/guardian/Receipts';
import axios from 'axios';

export default function App() {
  const { user, token, logout, submitConsent, successMessage, error, clearAlerts } = useAuthStore();
  const [page, setPage] = useState('login');

  // Simple Admin-only Cashier Form State
  const [cashierForm, setCashierForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [cashierMsg, setCashierMsg] = useState(null);
  const [cashierErr, setCashierErr] = useState(null);
  const [cashiersList, setCashiersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [adminTab, setAdminTab] = useState('cashiers');
  const [guardianTab, setGuardianTab] = useState('wards');

  const getLogDetails = (log) => {
    try {
      const after = log.after;
      if (log.action === 'signup') {
        return `Registered ${after?.role || 'user'}: ${after?.name || ''} (${after?.mobile || ''})`;
      }
      if (log.action === 'login') {
        return `User logged in (ID: ${log.actorId})`;
      }
      if (log.action === 'update_consent') {
        const status = after?.consentChecked ? 'Granted' : 'Revoked';
        return `DPDP Consent ${status} for Student #${log.entityId}`;
      }
      if (log.action === 'reset_password') {
        return `Password reset completed for User #${log.entityId}`;
      }
      return `Action on ${log.entity} #${log.entityId || ''}`;
    } catch (err) {
      return 'Activity details logged';
    }
  };

  const fetchCashiers = async () => {
    try {
      const response = await axios.get('/api/admin/cashiers');
      setCashiersList(response.data);
    } catch (err) {
      console.error('Failed to fetch cashiers:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get('/api/admin/audit-logs');
      setAuditLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  // Simple Guardian-only Student Consent State
  const [students, setStudents] = useState([]);

  const fetchMyStudents = async () => {
    try {
      const response = await axios.get('/api/guardians/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  useEffect(() => {
    if (token && user) {
      if (window.location.pathname.includes('/payment/success')) {
        setPage('payment-success');
      } else {
        setPage('dashboard');
      }
      if (user.role === 'admin') {
        fetchCashiers();
        fetchAuditLogs();
      } else if (user.role === 'guardian') {
        fetchMyStudents();
      }
    } else {
      if (page === 'dashboard' || page === 'payment-success') {
        setPage('login');
      }
    }
  }, [token, user]);

  const handleLogout = () => {
    logout();
    setPage('login');
  };

  // Handler for Guardian Toggling Student DPDP Consent
  const handleConsentToggle = async (studentId, checked) => {
    try {
      try {
        await submitConsent(studentId, checked);
        fetchMyStudents();
      } catch (err) {
        console.warn('API Consent submission failed:', err.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler for Admin creating a Cashier (requires Admin role token)
  const handleCreateCashier = async (e) => {
    e.preventDefault();
    setCashierMsg(null);
    setCashierErr(null);

    try {
      const response = await axios.post('/api/auth/signup', {
        ...cashierForm,
        role: 'cashier'
      });
      setCashierMsg(`Cashier account successfully created for ${response.data.user.name}`);
      setCashierForm({ name: '', email: '', mobile: '', password: '' });
      fetchCashiers();
      fetchAuditLogs();
    } catch (err) {
      setCashierErr(err.response?.data?.error || 'Failed to create cashier.');
    }
  };

  // Navigation router
  const renderPage = () => {
    switch (page) {
      case 'login':
        return <Login onNavigate={setPage} />;
      case 'signup':
        return <Signup onNavigate={setPage} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={setPage} />;
      case 'payment-success':
        return <PaymentSuccess onNavigate={setPage} />;
      case 'dashboard':
        if (!user) return <Login onNavigate={setPage} />;
        return renderDashboard();
      default:
        return <Login onNavigate={setPage} />;
    }
  };

  const renderDashboard = () => {
    return (
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        {/* Navigation / Header */}
        <header className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #ffffff, var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Smart School Dashboard
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Logged in as <strong style={{ color: 'white' }}>{user.name}</strong> ({user.email})
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span className="badge badge-active" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
              Role: {user.role}
            </span>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
              Log Out
            </button>
          </div>
        </header>

        {/* Dynamic content based on user role */}
        <main style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
          
          {/* GUARDIAN PANEL */}
          {user.role === 'guardian' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* Guardian Dashboard Sub-Navigation Tabs */}
              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', marginBottom: '10px' }}>
                <button 
                  type="button"
                  className={`btn ${guardianTab === 'wards' ? '' : 'btn-secondary'}`}
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                  onClick={() => setGuardianTab('wards')}
                >
                  My Wards
                </button>
                <button 
                  type="button"
                  className={`btn ${guardianTab === 'payment' ? '' : 'btn-secondary'}`}
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                  onClick={() => setGuardianTab('payment')}
                >
                  Pay Fees
                </button>
                <button 
                  type="button"
                  className={`btn ${guardianTab === 'receipts' ? '' : 'btn-secondary'}`}
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                  onClick={() => setGuardianTab('receipts')}
                >
                  Receipt History
                </button>
              </div>

              {guardianTab === 'wards' && (
                <div className="glass-panel" style={{ padding: '40px' }}>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Your Linked Students (Wards)</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.9rem' }}>
                    Under the **Digital Personal Data Protection (DPDP) Act 2023**, you must explicitly consent to the collection and processing of your minor ward's educational and payment data.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {students.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                        No students registered under your guardian account.
                      </div>
                    ) : (
                      students.map(student => (
                        <div key={student.id} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.2)' }}>
                          <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{student.name}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              Class: {student.class} | ID: {student.id} | DOB: {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                            </p>
                            {student.consentChecked ? (
                              <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '8px' }}>
                                ✓ DPDP Consent Recorded: {new Date(student.consentTimestamp).toLocaleString()}
                              </p>
                            ) : (
                              <p style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '8px' }}>
                                ⚠️ DPDP Consent Required: Please check the box on the right to authorize data processing.
                              </p>
                            )}
                            
                            {/* KYC Processing status alert */}
                            {student.status === 'pending' && student.ocrFlagged && (
                              <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px', fontWeight: 500 }}>
                                ⚠️ Document mismatch flagged. Awaiting Administrative verification override.
                              </p>
                            )}
                            {student.status === 'pending' && !student.ocrFlagged && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '4px' }}>
                                ⏳ Awaiting manual Admin verification approval.
                              </p>
                            )}
                            {student.status === 'active' && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px', fontWeight: 500 }}>
                                ✓ Account verified and fully active.
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <span className={`badge ${student.status === 'active' ? 'badge-active' : 'badge-pending'}`} style={{ textTransform: 'capitalize' }}>
                              {student.status}
                            </span>
                            <label className="checkbox-container" style={{ margin: 0 }}>
                              <input
                                type="checkbox"
                                checked={student.consentChecked}
                                onChange={(e) => handleConsentToggle(student.id, e.target.checked)}
                              />
                              <span className="checkmark"></span>
                              <span style={{ fontSize: '0.875rem', color: 'white' }}>Grant DPDP Consent</span>
                            </label>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {guardianTab === 'payment' && (
                <Payment />
              )}

              {guardianTab === 'receipts' && (
                <Receipts />
              )}

            </div>
          )}

          {/* ADMIN PANEL */}
          {user.role === 'admin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* Admin Dashboard Sub-Navigation Tabs */}
              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', marginBottom: '10px' }}>
                <button 
                  type="button"
                  className={`btn ${adminTab === 'cashiers' ? '' : 'btn-secondary'}`}
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                  onClick={() => setAdminTab('cashiers')}
                >
                  Cashier Setup
                </button>
                <button 
                  type="button"
                  className={`btn ${adminTab === 'fees' ? '' : 'btn-secondary'}`}
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                  onClick={() => setAdminTab('fees')}
                >
                  Fee Engine
                </button>
                <button 
                  type="button"
                  className={`btn ${adminTab === 'approvals' ? '' : 'btn-secondary'}`}
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                  onClick={() => setAdminTab('approvals')}
                >
                  Pending Approvals
                </button>
              </div>

              {adminTab === 'cashiers' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  {/* Cashier Creation Form */}
                  <div className="glass-panel" style={{ padding: '40px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Register New Cashier</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.875rem' }}>
                      Create secure cashier accounts. Cashiers can receive fee payments but cannot modify structural configurations.
                    </p>

                    {cashierMsg && <div className="alert alert-success">{cashierMsg}</div>}
                    {cashierErr && <div className="alert alert-error">{cashierErr}</div>}

                    <form onSubmit={handleCreateCashier}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          value={cashierForm.name}
                          onChange={(e) => setCashierForm({ ...cashierForm, name: e.target.value })}
                          placeholder="Cashier's name"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          className="form-input"
                          required
                          value={cashierForm.email}
                          onChange={(e) => setCashierForm({ ...cashierForm, email: e.target.value })}
                          placeholder="cashier@school.com"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mobile Number</label>
                        <input
                          type="tel"
                          className="form-input"
                          required
                          maxLength="10"
                          value={cashierForm.mobile}
                          onChange={(e) => setCashierForm({ ...cashierForm, mobile: e.target.value })}
                          placeholder="10-digit number"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          className="form-input"
                          required
                          value={cashierForm.password}
                          onChange={(e) => setCashierForm({ ...cashierForm, password: e.target.value })}
                          placeholder="Initial password"
                        />
                      </div>
                      <button type="submit" className="btn" style={{ width: '100%', marginTop: '10px' }}>
                        Create Cashier
                      </button>
                    </form>
                  </div>

                  {/* Stacked Panels on the Right */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* Active Cashiers dynamic List */}
                    <div className="glass-panel" style={{ padding: '30px' }}>
                      <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Registered Cashier Staff</h2>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.85rem' }}>
                        Showing active cashier staff accounts fetched dynamically from the database.
                      </p>

                      <div style={{ overflowX: 'auto' }}>
                        {cashiersList.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            No cashier accounts registered yet.
                          </div>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '10px' }}>Name</th>
                                <th style={{ padding: '10px' }}>Email</th>
                                <th style={{ padding: '10px' }}>Mobile</th>
                                <th style={{ padding: '10px' }}>Created By</th>
                                <th style={{ padding: '10px' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cashiersList.map((cashier) => (
                                <tr key={cashier.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '10px', fontWeight: 500 }}>{cashier.name}</td>
                                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{cashier.email}</td>
                                  <td style={{ padding: '10px' }}>{cashier.mobile}</td>
                                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{cashier.createdByName}</td>
                                  <td style={{ padding: '10px' }}>
                                    <span className="badge badge-active" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                      {cashier.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* Database Audit Logs Table */}
                    <div className="glass-panel" style={{ padding: '30px' }}>
                      <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>System Audit Logs (Recent Operations)</h2>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.85rem' }}>
                        Showing mutations tracked in the PostgreSQL `audit_logs` table (read-only for security auditing).
                      </p>

                      <div style={{ overflowX: 'auto' }}>
                        {auditLogs.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            No system logs recorded yet.
                          </div>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '10px', width: '15%' }}>Time</th>
                                <th style={{ padding: '10px', width: '20%' }}>Actor & Action</th>
                                <th style={{ padding: '10px', width: '50%' }}>Description (Real Data)</th>
                                <th style={{ padding: '10px', width: '15%', textAlign: 'center' }}>Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {auditLogs.map((log) => {
                                const isExpanded = expandedLogId === log.id;
                                return (
                                  <React.Fragment key={log.id}>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                                        {new Date(log.createdAt).toLocaleTimeString()}
                                      </td>
                                      <td style={{ padding: '10px' }}>
                                        <span className="badge" style={{ fontSize: '0.6rem', padding: '2px 5px', background: 'rgba(255,255,255,0.05)', color: 'white', marginRight: '5px', display: 'inline-block', textTransform: 'capitalize' }}>
                                          {log.actorRole}
                                        </span>
                                        <code style={{ color: 'var(--secondary)' }}>{log.action}</code>
                                      </td>
                                      <td style={{ padding: '10px', fontWeight: 500 }}>
                                        {getLogDetails(log)}
                                      </td>
                                      <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <button 
                                          type="button"
                                          className="btn btn-secondary" 
                                          style={{ padding: '4px 8px', fontSize: '0.65rem', borderRadius: '5px' }}
                                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                        >
                                          {isExpanded ? 'Hide' : 'Inspect'}
                                        </button>
                                      </td>
                                    </tr>
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan="4" style={{ padding: '15px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid var(--glass-border)' }}>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                            <div>
                                              <div style={{ color: 'var(--error)', marginBottom: '5px', fontWeight: 'bold' }}>BEFORE STATE:</div>
                                              <pre style={{ overflowX: 'auto', background: 'rgba(15,23,42,0.8)', padding: '10px', borderRadius: '5px', border: '1px solid rgba(244,63,94,0.2)', maxHeight: '150px' }}>
                                                {JSON.stringify(log.before, null, 2) || 'null'}
                                              </pre>
                                            </div>
                                            <div>
                                              <div style={{ color: 'var(--success)', marginBottom: '5px', fontWeight: 'bold' }}>AFTER STATE:</div>
                                              <pre style={{ overflowX: 'auto', background: 'rgba(15,23,42,0.8)', padding: '10px', borderRadius: '5px', border: '1px solid rgba(16,185,129,0.2)', maxHeight: '150px' }}>
                                                {JSON.stringify(log.after, null, 2) || 'null'}
                                              </pre>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {adminTab === 'fees' && (
                <FeeSetup />
              )}

              {adminTab === 'approvals' && (
                <Approvals />
              )}

            </div>
          )}

          {/* CASHIER PANEL */}
          {user.role === 'cashier' && (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Cashier Desk Console</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 24px auto' }}>
                You have cashier-level credentials. You are authorized to collect fees and generate invoices, but structural school changes (like fee modifications or class definitions) are locked.
              </p>
              <div style={{ display: 'inline-block', padding: '24px 48px', background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed var(--primary)', borderRadius: '15px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)' }}>
                  Ready to process fee payments (Awaiting Day 2 payment features...)
                </span>
              </div>
            </div>
          )}

        </main>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {renderPage()}
    </div>
  );
}
