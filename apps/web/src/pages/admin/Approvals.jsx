import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Icon } from '../../components/Icon';
import GlassCard from '../../components/ui/GlassCard';
import ActionButton from '../../components/ui/ActionButton';
import PageHeader from '../../components/ui/PageHeader';
import StatusChip from '../../components/ui/StatusChip';

const TABS = [
  { key: 'ocr', label: 'OCR Identity Approvals', icon: 'document_scanner' },
  { key: 'waivers', label: 'Waiver & Penalty Requests', icon: 'rule' },
  { key: 'refunds', label: 'Refund Processing', icon: 'replay' },
];

export default function Approvals() {
  const [activeTab, setActiveTab] = useState('ocr');

  const [approvals, setApprovals] = useState([]);
  const [waivers, setWaivers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [overrideStudentId, setOverrideStudentId] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    name: '',
    class: 'Grade 5-A',
    dob: ''
  });

  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [refundTxId, setRefundTxId] = useState(null);
  const [refundReason, setRefundReason] = useState('');

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/admin/approvals', { headers });
      setApprovals(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending approvals.');
    }
  };

  const fetchWaivers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/waivers?status=pending', { headers });
      setWaivers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending waivers/penalties.');
    }
  };

  const fetchRefundData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [txRes, studRes] = await Promise.all([
        axios.get('/api/payments/transactions', { headers }),
        axios.get('/api/admin/students', { headers })
      ]);
      setTransactions(txRes.data.filter(t => t.status === 'success' || t.status === 'reversed'));
      setStudents(studRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch transaction or student ledger.');
    }
  };

  useEffect(() => {
    if (activeTab === 'ocr') {
      fetchPending();
    } else if (activeTab === 'waivers') {
      fetchWaivers();
    } else {
      fetchRefundData();
    }
  }, [activeTab]);

  const handleVerifyDirect = async (studentId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/admin/approvals/${studentId}/verify`, {}, { headers });
      setSuccess('Student KYC verified and marked active successfully!');
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOverride = (student) => {
    setOverrideStudentId(student.id);
    let dobVal = '';
    if (student.dob) {
      try {
        dobVal = new Date(student.dob).toISOString().split('T')[0];
      } catch (e) {
        dobVal = '';
      }
    }
    setOverrideForm({
      name: student.name,
      class: student.class,
      dob: dobVal
    });
    setSuccess(null);
    setError(null);
  };

  const handleCloseOverride = () => {
    setOverrideStudentId(null);
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/admin/approvals/${overrideStudentId}/override`, overrideForm, { headers });
      setSuccess('Student profile manually corrected and KYC verified successfully!');
      setOverrideStudentId(null);
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.error || 'Override submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWaiver = async (id) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`/api/waivers/${id}/approve`, {}, { headers });
      setSuccess('Waiver/penalty request approved successfully.');
      fetchWaivers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve request.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReject = (id) => {
    setRejectId(id);
    setRejectReason('');
    setSuccess(null);
    setError(null);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`/api/waivers/${rejectId}/reject`, { reason: rejectReason }, { headers });
      setSuccess('Waiver/penalty request rejected.');
      setRejectId(null);
      fetchWaivers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject request.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRefund = (id) => {
    setRefundTxId(id);
    setRefundReason('');
    setSuccess(null);
    setError(null);
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundReason) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/refunds`, { transaction_id: refundTxId, reason: refundReason }, { headers });
      setSuccess('Refund reversal processed successfully!');
      setRefundTxId(null);
      fetchRefundData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process refund.');
    } finally {
      setLoading(false);
    }
  };

  const isNameMismatched = (name1, name2) => {
    if (!name1 || !name2) return true;
    return name1.toLowerCase().replace(/[^a-z0-9]/g, '') !== name2.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const isDobMismatched = (dob1, dob2) => {
    if (!dob1 || !dob2) return true;
    try {
      return new Date(dob1).toDateString() !== new Date(dob2).toDateString();
    } catch (e) {
      return true;
    }
  };

  const switchTab = (key) => {
    setActiveTab(key);
    setError(null);
    setSuccess(null);
    setRejectId(null);
    setRefundTxId(null);
    setOverrideStudentId(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Pending Approvals"
        title="Identity, Waivers & Refunds"
      />

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-buttons px-5 h-11 text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-ink-black text-white' : 'border border-gray-200 text-ink-black hover:bg-gray-50'}`}
          >
            <Icon name={tab.icon} className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="p-4 rounded-[12px] bg-error-container text-error text-sm mb-4">{error}</div>}
      {success && <div className="p-4 rounded-[12px] bg-success-container text-success text-sm mb-4">{success}</div>}

      {rejectId && (
        <GlassCard className="mb-6">
          <h3 className="font-medium text-ink-black mb-4">Provide Rejection Reason</h3>
          <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Reason</label>
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejecting waiver/penalty request..."
                required
                className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
              />
            </div>
            <div className="flex gap-3">
              <ActionButton type="submit" disabled={loading}>Confirm Reject</ActionButton>
              <ActionButton variant="secondary" type="button" onClick={() => setRejectId(null)}>Cancel</ActionButton>
            </div>
          </form>
        </GlassCard>
      )}

      {refundTxId && (
        <GlassCard className="mb-6">
          <h3 className="font-medium text-ink-black mb-4">Initiate Refund Reversal</h3>
          <form onSubmit={handleRefundSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Reason</label>
              <input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for refunding this payment..."
                required
                className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
              />
            </div>
            <div className="flex gap-3">
              <ActionButton type="submit" disabled={loading}>{loading ? 'Processing Reversal…' : 'Confirm Refund'}</ActionButton>
              <ActionButton variant="secondary" type="button" onClick={() => setRefundTxId(null)} disabled={loading}>Cancel</ActionButton>
            </div>
          </form>
        </GlassCard>
      )}

      {activeTab === 'ocr' && (
        <GlassCard>
          <h2 className="font-medium text-ink-black mb-2">Pending Identity & Document Approvals</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Review minor details submitted by parents alongside automated OCR extraction data.
          </p>

          {approvals.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant text-sm">
              No pending KYC approvals found. All students are currently active.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {approvals.map(student => {
                const kyc = student.kycRecord;
                const nameMismatch = kyc ? isNameMismatched(student.name, kyc.ocrData?.name) : false;
                const dobMismatch = kyc ? isDobMismatched(student.dob, kyc.ocrData?.dob) : false;
                const isOverridingThis = overrideStudentId === student.id;

                return (
                  <div
                    key={student.id}
                    className={`rounded-[12px] border p-6 ${student.ocrFlagged ? 'border-error/30 bg-error-container/30' : 'border-gray-200 bg-white'}`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex-1 min-w-[250px]">
                        <StatusChip variant="neutral" className="mb-2">Student #{student.id} ({student.class})</StatusChip>
                        <h3 className="font-medium text-ink-black mb-1">{student.name}</h3>
                        <p className="text-sm text-on-surface-variant">
                          <strong>Parent:</strong> {student.guardian?.name} ({student.guardian?.mobile})
                        </p>
                        <p className="text-sm text-on-surface-variant mt-1">
                          <strong>Doc Type:</strong> <span className="uppercase">{kyc?.docType}</span> | <strong>Doc Ref (Masked):</strong> {kyc?.docRef || 'None'}
                        </p>
                      </div>

                      {kyc && (
                        <div className="flex-1 min-w-[250px] bg-gray-50 rounded-[12px] p-4 text-sm">
                          <span className={`font-bold block mb-2 ${student.ocrFlagged ? 'text-error' : 'text-success'}`}>
                            {student.ocrFlagged ? 'Automated OCR Alert: Mismatch Detected' : 'Automated OCR: OK'}
                          </span>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="border-r border-gray-200 pr-2">
                              <span className="text-on-surface-variant block">Form Input:</span>
                              <div className={nameMismatch ? 'text-error' : 'text-success'}>
                                <strong>Name:</strong> {student.name}
                              </div>
                              <div className={dobMismatch ? 'text-error' : 'text-success'}>
                                <strong>DOB:</strong> {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                            <div className="pl-1">
                              <span className="text-on-surface-variant block">OCR Detected:</span>
                              <div className={nameMismatch ? 'text-error' : 'text-success'}>
                                <strong>Name:</strong> {kyc.ocrData?.name || 'N/A'}
                              </div>
                              <div className={dobMismatch ? 'text-error' : 'text-success'}>
                                <strong>DOB:</strong> {kyc.ocrData?.dob ? new Date(kyc.ocrData.dob).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!isOverridingThis && (
                        <div className="flex flex-col gap-2 min-w-[150px]">
                          <ActionButton onClick={() => handleVerifyDirect(student.id)} disabled={loading}>Verify & Approve</ActionButton>
                          <ActionButton variant="secondary" onClick={() => handleOpenOverride(student)} disabled={loading}>Manual Override</ActionButton>
                        </div>
                      )}
                    </div>

                    {isOverridingThis && (
                      <div className="mt-5 pt-5 border-t border-gray-200">
                        <span className="text-xs font-medium text-module-dashboard uppercase tracking-wider block mb-4">
                          Manual Correction Override
                        </span>
                        <form onSubmit={handleOverrideSubmit} className="flex flex-col gap-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-ink-black mb-1">Corrected Name</label>
                              <input required value={overrideForm.name} onChange={(e) => setOverrideForm({ ...overrideForm, name: e.target.value })} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black focus:outline-none focus:ring-2 focus:ring-module-dashboard/30" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-ink-black mb-1">Corrected Class</label>
                              <select value={overrideForm.class} onChange={(e) => setOverrideForm({ ...overrideForm, class: e.target.value })} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black focus:outline-none focus:ring-2 focus:ring-module-dashboard/30">
                                <option value="Grade 1-A">Grade 1-A</option>
                                <option value="Grade 2-C">Grade 2-C</option>
                                <option value="Grade 5-A">Grade 5-A</option>
                                <option value="Grade 10-A">Grade 10-A</option>
                                <option value="Grade 10-B">Grade 10-B</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-ink-black mb-1">Corrected Date of Birth</label>
                              <input type="date" required value={overrideForm.dob} onChange={(e) => setOverrideForm({ ...overrideForm, dob: e.target.value })} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black focus:outline-none focus:ring-2 focus:ring-module-dashboard/30" />
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <ActionButton type="submit" disabled={loading}>{loading ? 'Submitting Override…' : 'Submit Correction & Approve'}</ActionButton>
                            <ActionButton variant="secondary" type="button" onClick={handleCloseOverride}>Cancel</ActionButton>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {activeTab === 'waivers' && (
        <GlassCard>
          <h2 className="font-medium text-ink-black mb-2">Waiver & Penalty Requests Approvals</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Review pending waiver requests or penalty fee additions submitted by cashier staff.
          </p>

          {waivers.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant text-sm">
              No pending waiver or penalty approvals found.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {waivers.map(record => (
                <div key={record.id} className="rounded-[12px] border border-gray-200 bg-white p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                      <StatusChip variant={record.type === 'waiver' ? 'success' : 'warning'} className="uppercase mb-2">{record.type} Request</StatusChip>
                      <h3 className="font-medium text-ink-black mb-1">{record.student.name} ({record.student.class})</h3>
                      <p className="text-sm text-on-surface-variant">
                        <strong>Component:</strong> {record.feeAssignment?.feeStructure?.name} | <strong>Reason:</strong> {record.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-semibold ${record.type === 'waiver' ? 'text-success' : 'text-error'}`}>
                        {record.type === 'waiver' ? '-' : '+'} ₹{Number(record.amount).toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        <ActionButton onClick={() => handleApproveWaiver(record.id)} disabled={loading}>Approve</ActionButton>
                        <ActionButton variant="secondary" onClick={() => handleOpenReject(record.id)} disabled={loading}>Reject</ActionButton>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {activeTab === 'refunds' && (
        <GlassCard>
          <h2 className="font-medium text-ink-black mb-2">Refund Processing & Bank Reversals</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Process bank reversals for educational fee payments. Stage 2 KYC banking details must be completed by parents prior to refund execution.
          </p>

          {transactions.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant text-sm">
              No payments found in ledger database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-on-surface-variant text-xs uppercase tracking-wider">
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Student (Class)</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Stage 2 KYC</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => {
                    const studentMatch = students.find(s => s.id === tx.studentId);
                    const hasKyc = studentMatch?.kycRecord?.isBankingComplete;

                    return (
                      <tr key={tx.id} className="border-b border-gray-100">
                        <td className="p-3 font-bold font-mono text-ink-black">{tx.receiptNumber}</td>
                        <td className="p-3">
                          <strong className="text-ink-black">{tx.student.name}</strong> ({tx.student.class})
                        </td>
                        <td className="p-3 font-bold text-ink-black">
                          {tx.status === 'reversed' ? '-' : ''}₹{Number(tx.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3">
                          <StatusChip variant={hasKyc ? 'success' : 'warning'}>
                            {hasKyc ? 'COMPLETE' : 'MISSING DETAILS'}
                          </StatusChip>
                        </td>
                        <td className="p-3 text-right">
                          {tx.status === 'reversed' ? (
                            <span className="text-sm text-error italic">Reversed</span>
                          ) : (
                            <ActionButton
                              variant="ghost"
                              onClick={() => handleOpenRefund(tx.id)}
                              disabled={!hasKyc || loading}
                            >
                              Refund Reversal
                            </ActionButton>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
