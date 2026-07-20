import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Icon } from '../../components/Icon';
import { Card, PillButton, InputField, Alert, Eyebrow, StatusBadge } from '../../components/ui/Primitives';

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

export default function CashierSetup() {
  const [cashierForm, setCashierForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [cashierMsg, setCashierMsg] = useState(null);
  const [cashierErr, setCashierErr] = useState(null);
  const [cashiersList, setCashiersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);

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

  useEffect(() => {
    fetchCashiers();
    fetchAuditLogs();
  }, []);

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

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Eyebrow>Cashier Setup</Eyebrow>
        <h1 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight mt-2">
          Staff & Audit Console
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Cashier Creation Form */}
        <Card>
          <h2 className="font-headline-sm text-headline-sm text-ink-black mb-2">Register New Cashier</h2>
          <p className="font-body text-[14px] text-on-surface-variant mb-6">
            Create secure cashier accounts. Cashiers can receive fee payments but cannot modify structural configurations.
          </p>

          <Alert tone="error">{cashierErr}</Alert>
          <Alert tone="success">{cashierMsg}</Alert>

          <form onSubmit={handleCreateCashier} className="flex flex-col gap-5 mt-2">
            <InputField
              label="Full Name"
              id="cashier-name"
              required
              value={cashierForm.name}
              onChange={(e) => setCashierForm({ ...cashierForm, name: e.target.value })}
              placeholder="Cashier's name"
            />
            <InputField
              label="Email Address"
              id="cashier-email"
              type="email"
              required
              value={cashierForm.email}
              onChange={(e) => setCashierForm({ ...cashierForm, email: e.target.value })}
              placeholder="cashier@school.com"
            />
            <InputField
              label="Mobile Number"
              id="cashier-mobile"
              type="tel"
              required
              maxLength={10}
              value={cashierForm.mobile}
              onChange={(e) => setCashierForm({ ...cashierForm, mobile: e.target.value })}
              placeholder="10-digit number"
            />
            <InputField
              label="Password"
              id="cashier-password"
              type="password"
              required
              value={cashierForm.password}
              onChange={(e) => setCashierForm({ ...cashierForm, password: e.target.value })}
              placeholder="Initial password"
            />
            <PillButton type="submit" className="mt-1">Create Cashier</PillButton>
          </form>
        </Card>

        {/* Stacked Panels on the Right */}
    <div className="flex flex-col gap-section-sm">
          {/* Active Cashiers dynamic List */}
          <Card>
            <h2 className="font-headline-sm text-headline-sm text-ink-black mb-2">Registered Cashier Staff</h2>
            <p className="font-body text-[14px] text-on-surface-variant mb-6">
              Showing active cashier staff accounts fetched dynamically from the database.
            </p>

            <div className="overflow-x-auto">
              {cashiersList.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant text-[14px]">
                  No cashier accounts registered yet.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-outline-variant/40 text-on-surface-variant font-eyebrow text-eyebrow uppercase tracking-wider">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Created By</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashiersList.map((cashier) => (
                      <tr key={cashier.id} className="border-b border-outline-variant/20">
                        <td className="p-3 font-medium text-ink-black">{cashier.name}</td>
                        <td className="p-3 text-on-surface-variant">{cashier.email}</td>
                        <td className="p-3 text-ink-black">{cashier.mobile}</td>
                        <td className="p-3 text-on-surface-variant">{cashier.createdByName}</td>
                        <td className="p-3">
                          <StatusBadge tone="active">{cashier.status}</StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {/* Database Audit Logs Table */}
          <Card>
            <h2 className="font-headline-sm text-headline-sm text-ink-black mb-2">System Audit Logs</h2>
            <p className="font-body text-[14px] text-on-surface-variant mb-6">
              Showing mutations tracked in the audit log table (read-only for security auditing).
            </p>

            <div className="overflow-x-auto">
              {auditLogs.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant text-[14px]">
                  No system logs recorded yet.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-outline-variant/40 text-on-surface-variant font-eyebrow text-eyebrow uppercase tracking-wider">
                      <th className="p-3">Time</th>
                      <th className="p-3">Actor & Action</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <React.Fragment key={log.id}>
                          <tr className="border-b border-outline-variant/20">
                            <td className="p-3 text-on-surface-variant">{new Date(log.createdAt).toLocaleTimeString()}</td>
                            <td className="p-3">
                              <StatusBadge tone="ink" className="mr-2 capitalize">{log.actorRole}</StatusBadge>
                              <code className="text-light-signal-orange">{log.action}</code>
                            </td>
                            <td className="p-3 font-medium text-ink-black">{getLogDetails(log)}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 px-3 h-8 rounded-full border border-outline-variant text-ink-black text-[12px] hover:bg-surface-container-low transition-colors"
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              >
                                <Icon name={isExpanded ? 'expand_less' : 'expand_more'} className="text-[16px]" />
                                {isExpanded ? 'Hide' : 'Inspect'}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan="4" className="p-4 bg-surface-container-low border-b border-outline-variant/30">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[12px] font-mono">
                                  <div>
                                    <div className="text-error font-bold mb-2">BEFORE STATE:</div>
                                    <pre className="overflow-x-auto bg-surface-container-highest p-3 rounded-[12px] border border-error/20 max-h-[150px] text-ink-black">
                                      {JSON.stringify(log.before, null, 2) || 'null'}
                                    </pre>
                                  </div>
                                  <div>
                                    <div className="text-success font-bold mb-2">AFTER STATE:</div>
                                    <pre className="overflow-x-auto bg-surface-container-highest p-3 rounded-[12px] border border-success/20 max-h-[150px] text-ink-black">
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
          </Card>
        </div>
      </div>
    </div>
  );
}
