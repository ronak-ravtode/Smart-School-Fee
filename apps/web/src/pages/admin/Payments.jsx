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
          <ActionButton icon={() => <Icon name="add" className="text-lg" />} onClick={() => setDrawerOpen(true)}>
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search student..." className="mb-4" />
        <ActionButton className="w-full" onClick={() => { setDrawerOpen(false); toast('Payment recorded'); }}>Submit Payment</ActionButton>
      </Drawer>
    </div>
  );
}
