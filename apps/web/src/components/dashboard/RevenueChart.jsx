import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';

export default function RevenueChart() {
  const [chartType, setChartType] = useState('bar');
  const [period, setPeriod] = useState('monthly');
  const [classFilter, setClassFilter] = useState('');

  // 1. Fetch real revenue breakdown data
  const { data: rawData, loading } = useDashboardQuery('/api/dashboard/revenue-breakdown', {
    period,
    class: classFilter
  }, 5000);

  // 2. Format database results for Recharts
  const chartData = useMemo(() => {
    if (!rawData || !rawData.labels) return [];
    return rawData.labels.map((label, idx) => ({
      name: label.toUpperCase(),
      value: Number(rawData.data[idx]) || 0
    }));
  }, [rawData]);

  const COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px 15px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          fontSize: '0.8rem',
          color: '#f8fafc'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].name}</p>
          <p style={{ margin: '4px 0 0 0', color: '#a5b4fc' }}>
            Amount: ₹{Number(payload[0].value).toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
      
      {/* Filters & Toggles bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        
        {/* Dropdown Filters */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)} 
            className="form-input" 
            style={{ padding: '4px 8px', fontSize: '0.75rem', width: '100px', margin: 0, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)', color: '#000' }}
          >
            <option value="daily">Today</option>
            <option value="weekly">7 Days</option>
            <option value="monthly">30 Days</option>
          </select>
          <select 
            value={classFilter} 
            onChange={(e) => setClassFilter(e.target.value)} 
            className="form-input" 
            style={{ padding: '4px 8px', fontSize: '0.75rem', width: '130px', margin: 0, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)', color: '#000' }}
          >
            <option value="">All Classes</option>
            <option value="Grade 1-A">Grade 1-A</option>
            <option value="Grade 2-C">Grade 2-C</option>
            <option value="Grade 5-A">Grade 5-A</option>
            <option value="Grade 10-A">Grade 10-A</option>
            <option value="Grade 10-B">Grade 10-B</option>
          </select>
        </div>

        {/* View Toggle Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className="btn"
            style={{
              padding: '4px 12px',
              fontSize: '0.75rem',
              background: chartType === 'bar' ? '#6366f1' : 'rgba(15, 23, 42, 0.05)',
              color: chartType === 'bar' ? '#ffffff' : '#0f172a',
              border: chartType === 'bar' ? '1px solid #6366f1' : '1px solid rgba(0,0,0,0.1)'
            }}
          >
            Bar View
          </button>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            className="btn"
            style={{
              padding: '4px 12px',
              fontSize: '0.75rem',
              background: chartType === 'pie' ? '#6366f1' : 'rgba(15, 23, 42, 0.05)',
              color: chartType === 'pie' ? '#ffffff' : '#0f172a',
              border: chartType === 'pie' ? '1px solid #6366f1' : '1px solid rgba(0,0,0,0.1)'
            }}
          >
            Pie View
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
          Querying revenue data...
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
          No transaction history for the selected filters.
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#475569' }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
