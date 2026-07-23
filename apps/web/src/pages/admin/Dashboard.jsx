import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Icon } from '../../components/Icon';
import GlassCard from '../../components/ui/GlassCard';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import StatusChip from '../../components/ui/StatusChip';
import ActionButton from '../../components/ui/ActionButton';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';

const MODULE = 'dashboard';

const statIcons = {
  collected: (props) => <Icon name="payments" {...props} />,
  pending: (props) => <Icon name="hourglass_empty" {...props} />,
  overdue: (props) => <Icon name="warning" {...props} />,
  defaulters: (props) => <Icon name="people" {...props} />,
};

export default function Dashboard({ onNavigate }) {
  const { data: metrics, loading } = useDashboardQuery('/api/dashboard/metrics', {}, 5000);
  const { data: revenue } = useDashboardQuery('/api/dashboard/revenue-breakdown', { period: 'monthly' }, 5000);
  const { data: defaulters } = useDashboardQuery('/api/dashboard/defaulters', {}, 5000);

  const m = metrics || {};
  const revData = revenue?.labels?.map((l, i) => ({ name: l.toUpperCase(), value: Number(revenue.data[i]) || 0 })) || [];

  const COLORS = ['#8b8fd4', '#6bc9a9', '#5bb98a', '#e8977a', '#e8b86a'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white shadow-lg rounded-[12px] p-3 border border-gray-100 text-sm">
          <p className="font-medium text-ink-black">{label}</p>
          <p className="font-semibold" style={{ color: payload[0].color }}>₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <PageHeader
        eyebrow="Financial Dashboard"
        title="School Financial Overview"
        action={
          <ActionButton icon={() => <Icon name="download" className="text-lg" />}>
            Export Report
          </ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Collected Today" value={m.today_collections || 0} icon={statIcons.collected} accent="dashboard" />
        <StatCard title="Pending Dues" value={m.pending_fees || 0} icon={statIcons.pending} accent="reports" />
        <StatCard title="Overdue Amount" value={m.overdue_amount || 0} icon={statIcons.overdue} accent="defaulters" />
        <StatCard title="Defaulters" value={m.defaulters_count || 0} icon={statIcons.defaulters} accent="defaulters" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <GlassCard className="lg:col-span-2">
          <h3 className="font-medium text-ink-black mb-4">Revenue Trend</h3>
          {revData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revData}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#8b8fd4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-on-surface-variant">{loading ? 'Loading...' : 'No data'}</div>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-medium text-ink-black mb-4">Payment Methods</h3>
          {revData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {revData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-on-surface-variant">{loading ? 'Loading...' : 'No data'}</div>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <GlassCard>
          <h3 className="font-medium text-ink-black mb-4">Priority Defaulters</h3>
          {(defaulters || []).length > 0 ? (
            <div className="space-y-3">
              {defaulters.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-[10px] bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-ink-black">{d.name}</p>
                    <p className="text-xs text-on-surface-variant">{d.class} • {d.overdue_days} days overdue</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip variant={d.overdue_days > 60 ? 'error' : 'warning'}>
                      ₹{Number(d.overdue_amount).toLocaleString('en-IN')}
                    </StatusChip>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No overdue accounts</p>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-medium text-ink-black mb-4">Recent Activity</h3>
          <p className="text-sm text-on-surface-variant">Payment activity feed appears here</p>
        </GlassCard>
      </div>

      <div className="flex gap-3">
        <ActionButton icon={() => <Icon name="payments" className="text-lg" />} onClick={() => onNavigate?.('payments')}>Collect Fee</ActionButton>
        <ActionButton variant="secondary" icon={() => <Icon name="add" className="text-lg" />} onClick={() => onNavigate?.('fee-engine')}>Create Invoice</ActionButton>
        <ActionButton variant="secondary" icon={() => <Icon name="price_check" className="text-lg" />}>Apply Waiver</ActionButton>
        <ActionButton variant="secondary" icon={() => <Icon name="gavel" className="text-lg" />}>Add Penalty</ActionButton>
      </div>
    </div>
  );
}
