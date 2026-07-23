import { useState } from 'react';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';
import DataTable from '../../components/ui/DataTable';
import StatusChip from '../../components/ui/StatusChip';
import SearchInput from '../../components/ui/SearchInput';
import FilterBar from '../../components/ui/FilterBar';
import ActionButton from '../../components/ui/ActionButton';
import { Icon } from '../../components/Icon';

export default function Defaulters() {
  const [search, setSearch] = useState('');
  const [daysFilter, setDaysFilter] = useState('all');
  const { data: defaulters, loading } = useDashboardQuery('/api/dashboard/defaulters', { sort_by: 'risk' }, 5000);
  const list = (defaulters || []).filter((d) => {
    if (search && !d.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (daysFilter === '30' && (d.overdue_days || 0) < 30) return false;
    if (daysFilter === '60' && (d.overdue_days || 0) < 60) return false;
    if (daysFilter === '90' && (d.overdue_days || 0) < 90) return false;
    return true;
  });

  const columns = [
    { key: 'name', label: 'Student' },
    { key: 'class', label: 'Class' },
    { key: 'overdue_amount', label: 'Overdue', render: (v) => <span className="font-semibold" style={{ color: '#d46a7a' }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
    { key: 'overdue_days', label: 'Days', render: (v) => {
      const map = v > 60 ? 'error' : v > 30 ? 'warning' : 'pending';
      return <StatusChip variant={map}>{v || 0}d</StatusChip>;
    }},
    {
      key: 'risk',
      label: 'Risk',
      render: (v, row) => {
        const pct = row.default_risk_pct || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-gray-200">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#d46a7a' }} />
            </div>
            <span className="text-xs text-on-surface-variant">{pct}%</span>
          </div>
        );
      },
    },
  ];

  const totalOverdue = list.reduce((s, d) => s + Number(d.overdue_amount || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Defaulters"
        title={`${list.length} Overdue Accounts`}
        subtitle={`₹${totalOverdue.toLocaleString('en-IN')} total outstanding`}
        action={
          <div className="flex gap-2">
            <ActionButton icon={() => <Icon name="campaign" className="text-lg" />}>Send Reminders</ActionButton>
            <ActionButton variant="secondary" icon={() => <Icon name="gavel" className="text-lg" />}>Apply Penalties</ActionButton>
          </div>
        }
      />

      <GlassCard>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search student..." className="flex-1" />
          <FilterBar>
            <select className="h-10 px-3 rounded-inputs border border-gray-200 text-sm" value={daysFilter} onChange={(e) => setDaysFilter(e.target.value)}>
              <option value="all">All Days</option>
              <option value="30">30+ Days</option>
              <option value="60">60+ Days</option>
              <option value="90">90+ Days</option>
            </select>
          </FilterBar>
        </div>
        <DataTable columns={columns} data={list} loading={loading} emptyMessage="No defaulters found" />
      </GlassCard>
    </div>
  );
}
