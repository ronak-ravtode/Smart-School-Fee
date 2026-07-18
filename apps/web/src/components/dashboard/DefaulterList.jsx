import React, { useState } from 'react';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';

export default function DefaulterList() {
  const [sortBy, setSortBy] = useState('days');
  const [filterClass, setFilterClass] = useState('');

  // Fetch real defaulters data
  const { data: defaulters = [], loading } = useDashboardQuery('/api/dashboard/defaulters', {
    sort_by: sortBy,
    filter_class: filterClass
  }, 5000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* Search & Sort Panel */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="form-input"
          style={{ padding: '6px 12px', fontSize: '0.75rem', width: '130px', margin: 0, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)', color: '#000' }}
        >
          <option value="days">Sort by Days</option>
          <option value="amount">Sort by Amount</option>
        </select>
        
        <select 
          value={filterClass} 
          onChange={(e) => setFilterClass(e.target.value)} 
          className="form-input" 
          style={{ padding: '6px 12px', fontSize: '0.75rem', width: '140px', margin: 0, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)', color: '#000' }}
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
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.85rem' }}>
          Querying defaulter logs...
        </div>
      ) : defaulters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.85rem' }}>
          No student accounts are currently overdue.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', minWidth: '400px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.1)', color: '#475569' }}>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Student Name</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Class</th>
                <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'center' }}>Overdue Days</th>
                <th style={{ padding: '12px 10px', fontWeight: 600, textAlign: 'right' }}>Overdue Amount</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.map((defaulter, idx) => (
                <tr 
                  key={idx} 
                  style={{ 
                    borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
                    color: '#1e293b'
                  }}
                >
                  <td style={{ padding: '12px 10px', fontWeight: 500 }}>{defaulter.name}</td>
                  <td style={{ padding: '12px 10px' }}>{defaulter.class}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 600, color: '#e11d48' }}>
                    {defaulter.overdue_days} days
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700 }}>
                    ₹{Number(defaulter.overdue_amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
