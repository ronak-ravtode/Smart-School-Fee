import { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';
import DataTable from '../../components/ui/DataTable';
import StatusChip from '../../components/ui/StatusChip';
import SearchInput from '../../components/ui/SearchInput';
import FilterBar from '../../components/ui/FilterBar';
import ActionButton from '../../components/ui/ActionButton';
import Drawer from '../../components/ui/Drawer';
import { Icon } from '../../components/Icon';
import { toast } from '../../components/ui/Toast';

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [chequeNo, setChequeNo] = useState('');
  const [bank, setBank] = useState('');
  const [saving, setSaving] = useState(false);
  const [drawerMsg, setDrawerMsg] = useState(null);
  const [drawerErr, setDrawerErr] = useState(null);

  const fetch = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/payments/transactions', { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const searchStudents = async () => {
    if (!studentSearch.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } });
      setStudents(res.data.filter(s => s.name?.toLowerCase().includes(studentSearch.toLowerCase())));
    } catch (e) {
      console.error(e);
    }
  };

  const loadAssignments = async (studentId) => {
    if (!studentId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/fees/assignments?studentId=${studentId}`, { headers: { Authorization: `Bearer ${token}` } });
      setAssignments(res.data.filter(a => a.status === 'pending' || a.status === 'overdue'));
    } catch (e) {
      console.error(e);
    }
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    setStudentSearch('');
    setStudents([]);
    setSelectedStudentId('');
    setAssignments([]);
    setSelectedAssignmentId('');
    setPayMethod('CASH');
    setChequeNo('');
    setBank('');
    setDrawerMsg(null);
    setDrawerErr(null);
  };

  const handleRecordPayment = async () => {
    if (!selectedStudentId || !selectedAssignmentId) {
      setDrawerErr('Select a student and fee assignment');
      return;
    }
    if (payMethod === 'CHEQUE' && (!chequeNo || !bank)) {
      setDrawerErr('Cheque number and bank are required for cheque payments');
      return;
    }
    setSaving(true);
    setDrawerErr(null);
    try {
      const token = localStorage.getItem('token');
      const body = { feeAssignmentId: Number(selectedAssignmentId), method: payMethod };
      if (payMethod === 'CHEQUE') {
        body.chequeNo = chequeNo;
        body.bank = bank;
      }
      await axios.post('/api/payments/collect-manual', body, { headers: { Authorization: `Bearer ${token}` } });
      setDrawerMsg('Payment recorded successfully');
      setDrawerOpen(false);
      setSaving(false);
      toast('Payment recorded');
      fetch();
    } catch (e) {
      setDrawerErr(e.response?.data?.error || 'Failed to record payment');
      setSaving(false);
    }
  };

  const filtered = transactions.filter((t) => {
    if (search && !t.student?.name?.toLowerCase().includes(search.toLowerCase()) && !t.receiptNumber?.includes(search)) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    return true;
  });

  const columns = [
    { key: 'receiptNumber', label: 'Receipt', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
    { key: 'student', label: 'Student', render: (v) => v?.name || '—' },
    { key: 'amount', label: 'Amount', render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    { key: 'method', label: 'Method', render: (v) => <span className="capitalize">{v?.toLowerCase() || '—'}</span> },
    { key: 'status', label: 'Status', render: (v) => {
      const map = { success: 'success', pending: 'pending', failed: 'error', reversed: 'neutral' };
      return <StatusChip variant={map[v] || 'neutral'}>{v}</StatusChip>;
    }},
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Payments"
        title="Payment Management"
        action={
          <ActionButton icon={() => <Icon name="add" className="text-lg" />} onClick={openDrawer}>
            Record Payment
          </ActionButton>
        }
      />

      <GlassCard>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student or receipt..." className="flex-1" />
          <FilterBar>
            <select className="h-10 px-3 rounded-inputs border border-gray-200 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
            </select>
          </FilterBar>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No payments found" />
      </GlassCard>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Record Payment" width="480px">
        <p className="text-sm text-on-surface-variant mb-4">Search for a student and record a payment.</p>

        <div className="flex gap-2 mb-4">
          <SearchInput value={studentSearch} onChange={setStudentSearch} placeholder="Search student..." className="flex-1" />
          <ActionButton onClick={searchStudents}>Search</ActionButton>
        </div>

        {students.length > 0 && (
          <div className="mb-4 max-h-[160px] overflow-y-auto space-y-1">
            {students.map(s => (
              <button key={s.id} type="button" className={`w-full text-left px-3 py-2 rounded-[8px] text-sm ${selectedStudentId === s.id.toString() ? 'bg-module-dashboard/10 font-medium' : 'hover:bg-gray-50'}`} onClick={() => { setSelectedStudentId(s.id.toString()); setSelectedAssignmentId(''); loadAssignments(s.id); }}>
                {s.name} ({s.class})
              </button>
            ))}
          </div>
        )}

        {assignments.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink-black mb-1">Fee Assignment</label>
            <select className="w-full h-10 px-3 rounded-inputs border border-gray-200 text-sm" value={selectedAssignmentId} onChange={(e) => setSelectedAssignmentId(e.target.value)}>
              <option value="">Select fee...</option>
              {assignments.map(a => (
                <option key={a.id} value={a.id}>{a.feeStructure?.name} — ₹{Number(a.feeStructure?.amount || 0).toLocaleString('en-IN')}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-ink-black mb-1">Payment Method</label>
          <select className="w-full h-10 px-3 rounded-inputs border border-gray-200 text-sm" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>

        {payMethod === 'CHEQUE' && (
          <div className="flex flex-col gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Cheque Number</label>
              <input className="w-full h-10 px-3 rounded-inputs border border-gray-200 text-sm" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} placeholder="Enter cheque number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Bank Name</label>
              <input className="w-full h-10 px-3 rounded-inputs border border-gray-200 text-sm" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Enter bank name" />
            </div>
          </div>
        )}

        {drawerErr && <div className="p-3 rounded-[8px] bg-error-container text-error text-sm mb-4">{drawerErr}</div>}
        {drawerMsg && <div className="p-3 rounded-[8px] bg-success-container text-success text-sm mb-4">{drawerMsg}</div>}

        <ActionButton className="w-full" disabled={saving} onClick={handleRecordPayment}>{saving ? 'Recording...' : 'Submit Payment'}</ActionButton>
      </Drawer>
    </div>
  );
}
