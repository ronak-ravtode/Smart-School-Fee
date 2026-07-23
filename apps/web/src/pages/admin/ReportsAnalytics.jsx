import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';
import ActionButton from '../../components/ui/ActionButton';
import { Icon } from '../../components/Icon';

const CHART_COLORS = ['#8b8fd4', '#6bc9a9', '#5bb98a', '#e8977a', '#e8b86a', '#d46a7a'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white shadow-lg rounded-[12px] p-3 border border-gray-100 text-sm">
        <p className="font-medium text-ink-black">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>₹{Number(p.value).toLocaleString('en-IN')}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsAnalytics() {
  const [period, setPeriod] = useState('monthly');
  const { data: report, loading } = useDashboardQuery('/api/dashboard/reports', { period }, 5000);
  const { data: paymentMethods } = useDashboardQuery('/api/dashboard/payment-methods', {}, 5000);

  const revenueData = report?.breakdown?.map((item) => ({
    name: item.type?.toUpperCase(),
    value: Number(item.total || 0),
  })) || [];

  const payMethodData = paymentMethods?.labels?.map((l, i) => ({ name: l.toUpperCase(), value: Number(paymentMethods.data[i]) || 0 })) || [];

  return (
    <div>
      <PageHeader
        eyebrow="Reports"
        title="Analytics & Insights"
        action={
          <div className="flex gap-2">
            <select className="h-10 px-3 rounded-inputs border border-gray-200 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="session">Session</option>
            </select>
            <ActionButton icon={() => <Icon name="download" className="text-lg" />}>Export</ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassCard>
          <p className="text-xs text-on-surface-variant uppercase">Total Collected</p>
          <p className="text-2xl font-semibold text-ink-black mt-1">₹{Number(report?.total_collected || 0).toLocaleString('en-IN')}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-on-surface-variant uppercase">Total Pending</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: '#e8b86a' }}>₹{Number(report?.total_pending || 0).toLocaleString('en-IN')}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-on-surface-variant uppercase">Defaulters</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: '#d46a7a' }}>{report?.defaulters_count || 0}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-on-surface-variant uppercase">Avg Collection/Day</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: '#8b8fd4' }}>₹{Number(report?.avg_daily || 0).toLocaleString('en-IN')}</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <GlassCard>
          <h3 className="font-medium text-ink-black mb-4">Revenue Trend</h3>
          {!loading && revenueData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#e8b86a" strokeWidth={2} dot={{ fill: '#e8b86a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-[280px] flex items-center justify-center text-sm text-on-surface-variant">{loading ? 'Loading...' : 'No data'}</div>}
        </GlassCard>

        <GlassCard>
          <h3 className="font-medium text-ink-black mb-4">Collection by Fee Type</h3>
          {!loading && revenueData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6bc9a9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-[280px] flex items-center justify-center text-sm text-on-surface-variant">{loading ? 'Loading...' : 'No data'}</div>}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard>
          <h3 className="font-medium text-ink-black mb-4">Payment Methods</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={payMethodData.slice(0, 5)} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {payMethodData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-medium text-ink-black mb-4">Defaulter Aging</h3>
          <p className="text-sm text-on-surface-variant">Defaulter aging analysis appears here</p>
        </GlassCard>
      </div>
    </div>
  );
}
