import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function RevenueChart({ data }) {
  const [chartType, setChartType] = useState('bar');

  // Modern soft pastel colors for charts
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '350px' }}>
      
      {/* Toggles bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', gap: '8px' }}>
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

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

    </div>
  );
}
