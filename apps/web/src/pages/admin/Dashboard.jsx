import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BalanceCard from '../../components/dashboard/BalanceCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import DefaulterList from '../../components/dashboard/DefaulterList';
import QuickActions from '../../components/dashboard/QuickActions';
import Reports from './Reports';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import { Icon } from '../../components/Icon';
import { Alert, PillButton, InputField, SelectField } from '../../components/ui/Primitives';

export default function Dashboard({ setAdminTab }) {
  const { data: metrics, loading, refetch } = useDashboardQuery('/api/dashboard/metrics', {}, 5000);

  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [waiverAmount, setWaiverAmount] = useState('');
  const [waiverReason, setWaiverReason] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [submittingWaiver, setSubmittingWaiver] = useState(false);

  const loadStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } });
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to load students roster:', err);
    }
  };

  useEffect(() => {
    if (!selectedStudentId) {
      setAssignments([]);
      return;
    }
    const loadAssignments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/fees/assignments?studentId=${selectedStudentId}`, { headers: { Authorization: `Bearer ${token}` } });
        setAssignments(res.data.filter((a) => a.status === 'pending' || a.status === 'overdue'));
      } catch (err) {
        console.error('Failed to load student assignments:', err);
      }
    };
    loadAssignments();
  }, [selectedStudentId]);

  const handleActionClick = (action) => {
    if (action === 'Add Expense') {
      if (setAdminTab) setAdminTab('expenses');
    } else if (action === 'Send Reminder') {
      setToastMessage('SMS & Email overdue payment reminders dispatched to all defaulters!');
      setTimeout(() => setToastMessage(null), 4000);
    } else if (action === 'Waive Fee') {
      loadStudents();
      setFormError(null);
      setFormSuccess(null);
      setSelectedStudentId('');
      setSelectedAssignmentId('');
      setWaiverAmount('');
      setWaiverReason('');
      setShowWaiverModal(true);
    }
  };

  const handleWaiverSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedAssignmentId || !waiverAmount || !waiverReason) {
      setFormError('All fields are required to request a fee waiver.');
      return;
    }
    setSubmittingWaiver(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/waivers', { student_id: selectedStudentId, fee_assignment_id: selectedAssignmentId, amount: waiverAmount, type: 'waiver', reason: waiverReason }, { headers: { Authorization: `Bearer ${token}` } });
      setFormSuccess('Waiver request submitted successfully for Admin approval!');
      refetch();
      setTimeout(() => setShowWaiverModal(false), 2000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Waiver creation failed.');
    } finally {
      setSubmittingWaiver(false);
    }
  };

  const activeMetrics = metrics || { bank_balance: 0, in_hand_cash: 0, pending_fees: 0, today_collections: 0 };

  return (
    <div className="flex flex-col gap-section-sm pb-24 relative">
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] bg-ink-black text-canvas-cream rounded-full px-6 py-3 shadow-lg font-nav-button text-nav-button text-[14px]">
          {toastMessage}
        </div>
      )}

      {showWaiverModal && (
        <div className="fixed inset-0 z-50 bg-ink-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[460px] bg-lifted-cream rounded-frame p-card-padding shadow-deep border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-sm text-headline-sm text-ink-black">Request Fee Waiver</h2>
              <button type="button" onClick={() => setShowWaiverModal(false)} aria-label="Close" className="text-on-surface-variant hover:text-ink-black rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange">
                <Icon name="close" className="text-[22px]" />
              </button>
            </div>
            <p className="font-body text-body text-on-surface-variant text-[14px] mb-6">Create a pending waiver request. It must be approved under Pending Approvals.</p>
            <Alert tone="error">{formError}</Alert>
            <Alert tone="success">{formSuccess}</Alert>
            <form onSubmit={handleWaiverSubmit} className="flex flex-col gap-5 mt-2">
              <SelectField label="Select Student" id="waiver-student" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                ))}
              </SelectField>
              <SelectField label="Select Fee Component" id="waiver-assign" value={selectedAssignmentId} onChange={(e) => setSelectedAssignmentId(e.target.value)} disabled={!selectedStudentId}>
                <option value="">-- Choose Assignment --</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>{a.feeStructure.name} (Due: {new Date(a.dueDate).toLocaleDateString()})</option>
                ))}
              </SelectField>
              {selectedStudentId && assignments.length === 0 && (
                <span className="text-error text-[13px]">No pending fee assignments found for this student.</span>
              )}
              <InputField label="Waiver Amount (₹)" id="waiver-amount" type="number" placeholder="e.g. 1000" value={waiverAmount} onChange={(e) => setWaiverAmount(e.target.value)} />
              <InputField label="Reason / Justification" id="waiver-reason" placeholder="e.g. Academic scholarship rebate" value={waiverReason} onChange={(e) => setWaiverReason(e.target.value)} />
              <div className="flex gap-3 mt-2">
                <PillButton type="submit" disabled={submittingWaiver || assignments.length === 0}>{submittingWaiver ? 'Submitting…' : 'Submit Request'}</PillButton>
                <PillButton type="button" variant="outline" onClick={() => setShowWaiverModal(false)} disabled={submittingWaiver}>Cancel</PillButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider mb-2">Financial Dashboard</p>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight">School Financial Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 border border-outline-variant text-ink-black rounded-full px-5 h-12 font-nav-button text-nav-button text-[14px] hover:bg-surface-container-low transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange">
            <Icon name="download" className="text-[18px]" /> Export Report
          </button>
          <button className="inline-flex items-center gap-2 bg-ink-black text-canvas-cream rounded-full px-5 h-12 font-nav-button text-nav-button text-[14px] hover:bg-inverse-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange">
            <Icon name="add" className="text-[18px]" /> New Transaction
          </button>
        </div>
      </header>

      {loading && !metrics ? (
        <div className="text-center text-on-surface-variant py-8 text-[14px]">Loading dashboard metrics…</div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          <div className="md:col-span-7">
            <BalanceCard title="Bank Balance" value={activeMetrics.bank_balance} icon="account_balance_wallet" hero />
          </div>
          <div className="md:col-span-5 grid grid-rows-2 gap-6 md:gap-8">
            <BalanceCard title="In-Hand Cash" value={activeMetrics.in_hand_cash} icon="payments" tone="green" />
            <div className="grid grid-cols-2 gap-6 md:gap-8">
              <BalanceCard title="Pending Fees" value={activeMetrics.pending_fees} icon="warning" tone="red" />
              <BalanceCard title="Today's Collections" value={activeMetrics.today_collections} icon="trending_up" tone="amber" />
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-section-sm md:mb-section-md">
        <RevenueChart />
        <div className="bg-lifted-cream rounded-frame p-card-padding shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] border border-white/40">
          <p className="font-body text-body text-on-surface-variant mb-6">Revenue breakdown by fee category</p>
          <div className="flex flex-col gap-6">
            {(() => {
              const breakdown = [
                { label: 'Tuition Fees', pct: 65, icon: 'school', color: 'text-ink-black' },
                { label: 'Transport', pct: 20, icon: 'directions_bus', color: 'text-light-signal-orange' },
                { label: 'Cafeteria & Extras', pct: 15, icon: 'restaurant', color: 'text-outline-variant' },
              ];
              return breakdown.map(item => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-canvas-cream flex items-center justify-center shrink-0">
                    <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between mb-1">
                      <span className="font-nav-button text-nav-button text-ink-black">{item.label}</span>
                      <span className="font-nav-button text-nav-button text-ink-black">{item.pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-canvas-cream rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color.replace('text-', 'bg-')}`} style={{ width: `${item.pct}%` }}></div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      <section className="mb-section-sm md:mb-section-md">
        <DefaulterList />
      </section>

      <Reports />

      <QuickActions onAction={handleActionClick} />
    </div>
  );
}
