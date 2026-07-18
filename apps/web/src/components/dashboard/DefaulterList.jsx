import React, { useState, useMemo } from 'react';

export default function DefaulterList({ defaulters }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedDefaulters = useMemo(() => {
    let sortableDefaulters = [...defaulters];
    if (sortConfig.key) {
      sortableDefaulters.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Custom handling for numeric values
        if (typeof valA === 'string' && !isNaN(valA)) {
          valA = Number(valA);
          valB = Number(valB);
        }

        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableDefaulters;
  }, [defaulters, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', minWidth: '400px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.1)', color: '#475569' }}>
            <th 
              onClick={() => requestSort('name')} 
              style={{ padding: '12px 10px', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}
            >
              Student Name{getSortIndicator('name')}
            </th>
            <th 
              onClick={() => requestSort('class')} 
              style={{ padding: '12px 10px', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}
            >
              Class{getSortIndicator('class')}
            </th>
            <th 
              onClick={() => requestSort('days')} 
              style={{ padding: '12px 10px', cursor: 'pointer', userSelect: 'none', fontWeight: 600, textAlign: 'center' }}
            >
              Overdue Days{getSortIndicator('days')}
            </th>
            <th 
              onClick={() => requestSort('amount')} 
              style={{ padding: '12px 10px', cursor: 'pointer', userSelect: 'none', fontWeight: 600, textAlign: 'right' }}
            >
              Overdue Amount{getSortIndicator('amount')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedDefaulters.map((defaulter, idx) => (
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
                {defaulter.days} days
              </td>
              <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700 }}>
                ₹{Number(defaulter.amount).toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
