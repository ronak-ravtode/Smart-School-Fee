import { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';
import TabBar from '../../components/ui/TabBar';
import StatusChip from '../../components/ui/StatusChip';
import DataTable from '../../components/ui/DataTable';
import ActionButton from '../../components/ui/ActionButton';
import { Icon } from '../../components/Icon';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'payments', label: 'Payment History' },
  { key: 'fees', label: 'Fee Breakdown' },
  { key: 'waivers', label: 'Waivers & Penalties' },
  { key: 'receipts', label: 'Receipts' },
  { key: 'notes', label: 'Notes' },
];

export default function StudentProfile({ studentId }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [sRes, tRes, aRes] = await Promise.all([
          axios.get(`/api/admin/students?studentId=${studentId}`, { headers }),
          axios.get(`/api/fees/assignments?studentId=${studentId}`, { headers }),
          axios.get(`/api/payments/transactions?studentId=${studentId}`, { headers }),
        ]);
        setStudent(sRes.data);
        setAssignments(tRes.data);
        setTransactions(aRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [studentId]);

  if (!studentId) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-on-surface-variant">
        Select a student to view their profile
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Students"
        title={student?.name || 'Student Profile'}
        action={
          <div className="flex gap-2">
            <ActionButton icon={() => <Icon name="payments" className="text-lg" />}>Collect</ActionButton>
            <ActionButton variant="secondary" icon={() => <Icon name="price_check" className="text-lg" />}>Waive</ActionButton>
            <ActionButton variant="secondary" icon={() => <Icon name="print" className="text-lg" />}>Print</ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <GlassCard className="lg:col-span-1 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-on-surface-variant mb-3">
            {student?.name?.[0] || '?'}
          </div>
          <p className="font-medium text-ink-black">{student?.name}</p>
          <p className="text-sm text-on-surface-variant">{student?.class}</p>
          {student?.status && <StatusChip variant={student.status === 'active' ? 'success' : 'pending'} className="mt-2">{student.status}</StatusChip>}
        </GlassCard>

        <GlassCard className="lg:col-span-1">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Outstanding</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: '#d46a7a' }}>
            ₹{assignments.filter(a => a.status === 'pending' || a.status === 'overdue').reduce((s, a) => s + Number(a.feeStructure?.amount || 0), 0).toLocaleString('en-IN')}
          </p>
        </GlassCard>

        <GlassCard className="lg:col-span-1">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Total Paid</p>
          <p className="text-2xl font-semibold text-success mt-1">
            ₹{transactions.filter(t => t.status === 'success').reduce((s, t) => s + Number(t.amount || 0), 0).toLocaleString('en-IN')}
          </p>
        </GlassCard>

        <GlassCard className="lg:col-span-1">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Waivers</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: '#e8b86a' }}>₹0</p>
        </GlassCard>
      </div>

      <GlassCard>
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} className="mb-6" />

        {activeTab === 'overview' && (
          <DataTable
            columns={[
              { key: 'feeStructure', label: 'Fee Head', render: (v) => v?.name || '—' },
              { key: 'amount', label: 'Amount', render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
              { key: 'dueDate', label: 'Due Date', render: (v) => new Date(v).toLocaleDateString() },
              { key: 'status', label: 'Status', render: (v) => <StatusChip variant={v === 'paid' ? 'success' : v === 'overdue' ? 'error' : 'pending'}>{v}</StatusChip> },
            ]}
            data={assignments}
            emptyMessage="No fee assignments"
          />
        )}

        {activeTab === 'payments' && (
          <DataTable
            columns={[
              { key: 'receiptNumber', label: 'Receipt' },
              { key: 'amount', label: 'Amount', render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
              { key: 'method', label: 'Method' },
              { key: 'status', label: 'Status', render: (v) => <StatusChip variant={v === 'success' ? 'success' : v === 'failed' ? 'error' : 'pending'}>{v}</StatusChip> },
              { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
            ]}
            data={transactions}
            emptyMessage="No payments yet"
          />
        )}

        {activeTab === 'fees' && (
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <p className="text-sm text-on-surface-variant py-8 text-center">No fee assignments</p>
            ) : (
              assignments.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-[10px] bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-ink-black">{a.feeStructure?.name}</p>
                    <p className="text-xs text-on-surface-variant">Due: {new Date(a.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink-black">₹{Number(a.feeStructure?.amount || 0).toLocaleString('en-IN')}</p>
                    <StatusChip variant={a.status === 'paid' ? 'success' : a.status === 'overdue' ? 'error' : 'pending'}>{a.status}</StatusChip>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'waivers' && (
          <div className="space-y-3">
            {assignments.filter(a => a.waiverPenalties?.length > 0).length === 0 ? (
              <p className="text-sm text-on-surface-variant py-8 text-center">No waivers or penalties applied</p>
            ) : (
              assignments.filter(a => a.waiverPenalties?.length > 0).flatMap(a =>
                a.waiverPenalties.map(wp => (
                  <div key={wp.id} className="flex items-center justify-between p-3 rounded-[10px] bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-ink-black capitalize">{wp.type}: {a.feeStructure?.name}</p>
                      <p className="text-xs text-on-surface-variant">{wp.reason}</p>
                    </div>
                    <StatusChip variant={wp.type === 'waiver' ? 'success' : 'error'}>
                      {wp.type === 'waiver' ? '-' : '+'}₹{Number(wp.amount).toLocaleString('en-IN')}
                    </StatusChip>
                  </div>
                ))
              )
            )}
          </div>
        )}

        {activeTab === 'receipts' && (
          <DataTable
            columns={[
              { key: 'receiptNumber', label: 'Receipt' },
              { key: 'amount', label: 'Amount', render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
              { key: 'method', label: 'Method' },
              { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
            ]}
            data={transactions.filter(t => t.status === 'success' || t.status === 'reversed')}
            emptyMessage="No receipts available"
          />
        )}

        {activeTab === 'notes' && (
          <p className="text-sm text-on-surface-variant py-8 text-center">Notes — coming soon (deferred)</p>
        )}
      </GlassCard>
    </div>
  );
}
