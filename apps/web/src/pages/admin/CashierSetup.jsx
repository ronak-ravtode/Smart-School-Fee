import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Icon } from '../../components/Icon';
import GlassCard from '../../components/ui/GlassCard';
import ActionButton from '../../components/ui/ActionButton';
import PageHeader from '../../components/ui/PageHeader';
import StatusChip from '../../components/ui/StatusChip';

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
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/cashiers', { headers: { Authorization: `Bearer ${token}` } });
      setCashiersList(response.data);
    } catch (err) {
      console.error('Failed to fetch cashiers:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
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
    <div>
      <PageHeader
        eyebrow="Cashier Setup"
        title="Staff & Audit Console"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <GlassCard>
          <h2 className="font-medium text-ink-black mb-2">Register New Cashier</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Create secure cashier accounts. Cashiers can receive fee payments but cannot modify structural configurations.
          </p>

          {cashierErr && <div className="p-4 rounded-[12px] bg-error-container text-error text-sm mb-4">{cashierErr}</div>}
          {cashierMsg && <div className="p-4 rounded-[12px] bg-success-container text-success text-sm mb-4">{cashierMsg}</div>}

          <form onSubmit={handleCreateCashier} className="flex flex-col gap-5 mt-2">
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Full Name</label>
              <input required value={cashierForm.name} onChange={(e) => setCashierForm({ ...cashierForm, name: e.target.value })} placeholder="Cashier's name" className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Email Address</label>
              <input type="email" required value={cashierForm.email} onChange={(e) => setCashierForm({ ...cashierForm, email: e.target.value })} placeholder="cashier@school.com" className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Mobile Number</label>
              <input type="tel" required maxLength={10} value={cashierForm.mobile} onChange={(e) => setCashierForm({ ...cashierForm, mobile: e.target.value })} placeholder="10-digit number" className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Password</label>
              <input type="password" required value={cashierForm.password} onChange={(e) => setCashierForm({ ...cashierForm, password: e.target.value })} placeholder="Initial password" className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30" />
            </div>
            <ActionButton type="submit" className="mt-1">Create Cashier</ActionButton>
          </form>
        </GlassCard>

        <div className="flex flex-col gap-6">
          <GlassCard>
            <h2 className="font-medium text-ink-black mb-2">Registered Cashier Staff</h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Showing active cashier staff accounts fetched dynamically from the database.
            </p>

            <div className="overflow-x-auto">
              {cashiersList.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant text-sm">
                  No cashier accounts registered yet.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-on-surface-variant text-xs uppercase tracking-wider">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Created By</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashiersList.map((cashier) => (
                      <tr key={cashier.id} className="border-b border-gray-100">
                        <td className="p-3 font-medium text-ink-black">{cashier.name}</td>
                        <td className="p-3 text-on-surface-variant">{cashier.email}</td>
                        <td className="p-3 text-ink-black">{cashier.mobile}</td>
                        <td className="p-3 text-on-surface-variant">{cashier.createdByName}</td>
                        <td className="p-3">
                          <StatusChip variant="success">{cashier.status}</StatusChip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="font-medium text-ink-black mb-2">System Audit Logs</h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Showing mutations tracked in the audit log table (read-only for security auditing).
            </p>

            <div className="overflow-x-auto">
              {auditLogs.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant text-sm">
                  No system logs recorded yet.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-on-surface-variant text-xs uppercase tracking-wider">
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
                          <tr className="border-b border-gray-100">
                            <td className="p-3 text-on-surface-variant">{new Date(log.createdAt).toLocaleTimeString()}</td>
                            <td className="p-3">
                              <StatusChip variant="neutral" className="mr-2 capitalize">{log.actorRole}</StatusChip>
                              <code className="text-module-reconciliation">{log.action}</code>
                            </td>
                            <td className="p-3 font-medium text-ink-black">{getLogDetails(log)}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 px-3 h-8 rounded-buttons border border-gray-200 text-ink-black text-xs hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              >
                                <Icon name={isExpanded ? 'expand_less' : 'expand_more'} className="text-base" />
                                {isExpanded ? 'Hide' : 'Inspect'}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan="4" className="p-4 bg-gray-50 border-b border-gray-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-mono">
                                  <div>
                                    <div className="text-error font-bold mb-2">BEFORE STATE:</div>
                                    <pre className="overflow-x-auto bg-gray-100 p-3 rounded-[12px] border border-error/20 max-h-[150px] text-ink-black">
                                      {JSON.stringify(log.before, null, 2) || 'null'}
                                    </pre>
                                  </div>
                                  <div>
                                    <div className="text-success font-bold mb-2">AFTER STATE:</div>
                                    <pre className="overflow-x-auto bg-gray-100 p-3 rounded-[12px] border border-success/20 max-h-[150px] text-ink-black">
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
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
