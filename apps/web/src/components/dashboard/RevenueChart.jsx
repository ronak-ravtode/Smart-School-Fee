import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import { Icon } from '../Icon';

export default function RevenueChart() {
  const [chartType, setChartType] = useState('bar');
  const [period, setPeriod] = useState('monthly');
  const [classFilter, setClassFilter] = useState('');

  const { data: rawData, loading } = useDashboardQuery('/api/dashboard/revenue-breakdown', { period, class: classFilter }, 5000);

  const chartData = useMemo(() => {
    if (!rawData || !rawData.labels) return [];
    return rawData.labels.map((label, idx) => ({ name: label.toUpperCase(), value: Number(rawData.data[idx]) || 0 }));
  }, [rawData]);

  const COLORS = ['#141413', '#5f5e5d', '#F37338', '#CF4500', '#767872'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-ink-black text-white rounded-[12px] p-3 shadow-lg text-[13px]">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-light-signal-orange">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-lifted-cream rounded-frame p-card-padding shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] border border-white/40 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-headline-sm text-headline-sm text-ink-black">Collection Trends</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 rounded-full font-nav-button text-nav-button text-[13px] transition-colors ${chartType === 'bar' ? 'bg-ink-black text-canvas-cream' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <Icon name="bar_chart" className="text-[16px]" />
          </button>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            className={`px-3 py-1.5 rounded-full font-nav-button text-nav-button text-[13px] transition-colors ${chartType === 'pie' ? 'bg-ink-black text-canvas-cream' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <Icon name="donut_large" className="text-[16px]" />
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-canvas-cream border border-outline-variant/50 rounded-full px-4 py-2 font-nav-button text-nav-button text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-ink-black"
        >
          <option value="daily">Today</option>
          <option value="weekly">7 Days</option>
          <option value="monthly">30 Days</option>
        </select>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="bg-canvas-cream border border-outline-variant/50 rounded-full px-4 py-2 font-nav-button text-nav-button text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-ink-black"
        >
          <option value="">All Classes</option>
          <option value="Grade 1-A">Grade 1-A</option>
          <option value="Grade 2-C">Grade 2-C</option>
          <option value="Grade 5-A">Grade 5-A</option>
          <option value="Grade 10-A">Grade 10-A</option>
          <option value="Grade 10-B">Grade 10-B</option>
        </select>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-on-surface-variant text-[14px]">Querying revenue data…</div>
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-on-surface-variant text-[14px]">No transaction history for the selected filters.</div>
      ) : (
        <div className="flex-1 min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#464742" fontSize={10} tickLine={false} />
                <YAxis stroke="#464742" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20,20,19,0.06)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#464742' }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
