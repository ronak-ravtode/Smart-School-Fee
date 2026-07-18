import React from 'react';
import BalanceCard from '../../components/dashboard/BalanceCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import DefaulterList from '../../components/dashboard/DefaulterList';
import QuickActions from '../../components/dashboard/QuickActions';

// React Icons replacement as clean SVGs
const BankIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="21" x2="21" y2="21"></line>
    <rect x="3" y="10" width="18" height="11"></rect>
    <path d="M12 2L2 7h20L12 2z"></path>
    <line x1="7" y1="10" x2="7" y2="21"></line>
    <line x1="12" y1="10" x2="12" y2="21"></line>
    <line x1="17" y1="10" x2="17" y2="21"></line>
  </svg>
);

const CashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
    <circle cx="12" cy="12" r="2"></circle>
    <line x1="6" y1="12" x2="6" y2="12"></line>
    <line x1="18" y1="12" x2="18" y2="12"></line>
  </svg>
);

const PendingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const CollectionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default function Dashboard() {
  const mockMetrics = {
    bank_balance: 500000,
    in_hand_cash: 25000,
    pending_fees: 75000,
    today_collections: 15000,
  };

  const mockDefaulters = [
    { name: 'John Doe', class: 'Grade 10-A', days: 5, amount: 5000 },
    { name: 'Jane Smith', class: 'Grade 12-B', days: 10, amount: 10000 },
    { name: 'Rajesh Patel', class: 'Grade 5-A', days: 3, amount: 2500 },
    { name: 'Aarav Sharma', class: 'Grade 8-C', days: 15, amount: 15000 },
  ];

  const mockRevenueData = [
    { name: 'Tuition Fees', value: 300000 },
    { name: 'Transport Fees', value: 100000 },
    { name: 'Late Charges', value: 50000 },
    { name: 'Activity Fees', value: 25000 },
  ];

  return (
    <div className="pastel-gradient-bg" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px', borderRadius: '20px' }}>
      
      {/* Dashboard Top Statistics Row */}
      <div className="dashboard-grid-4">
        <BalanceCard 
          title="Bank Balance" 
          value={mockMetrics.bank_balance} 
          icon={<BankIcon />} 
          color="rgba(99, 102, 241, 0.2)"
        />
        <BalanceCard 
          title="In-Hand Cash" 
          value={mockMetrics.in_hand_cash} 
          icon={<CashIcon />} 
          color="rgba(6, 185, 129, 0.2)"
        />
        <BalanceCard 
          title="Pending Fees" 
          value={mockMetrics.pending_fees} 
          icon={<PendingIcon />} 
          color="rgba(244, 63, 94, 0.2)"
        />
        <BalanceCard 
          title="Today's Collections" 
          value={mockMetrics.today_collections} 
          icon={<CollectionIcon />} 
          color="rgba(245, 158, 11, 0.2)"
        />
      </div>

      {/* Middle Analytics Row */}
      <div className="dashboard-grid-2">
        
        {/* Recharts Analytics Panel */}
        <div className="frosted-glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 5px 0', color: '#0f172a' }}>
            Revenue Stream Breakdown
          </h2>
          <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '20px' }}>
            Visual distribution of collections by fee structure category.
          </p>
          <RevenueChart data={mockRevenueData} />
        </div>

        {/* Overdue Accounts Ledger Panel */}
        <div className="frosted-glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 5px 0', color: '#0f172a' }}>
            Outstanding Overdue Ledger
          </h2>
          <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '20px' }}>
            Defaulters roster matching overdue fee conditions.
          </p>
          <DefaulterList defaulters={mockDefaulters} />
        </div>

      </div>

      {/* Bottom Filter & Report Generator Panel */}
      <div className="frosted-glass-card" style={{ padding: '30px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 5px 0', color: '#0f172a' }}>
          Analytics & Report Filters
        </h2>
        <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '20px' }}>
          Query ledger datasets by custom grade or transaction time range.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: '#475569' }}>Target Class / Grade</label>
            <select className="form-input" style={{ background: 'rgba(255,255,255,0.7)', color: '#0f172a', border: '1px solid rgba(0,0,0,0.1)' }}>
              <option>All Standards</option>
              <option>Grade 5-A</option>
              <option>Grade 8-C</option>
              <option>Grade 10-A</option>
              <option>Grade 12-B</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: '#475569' }}>Reconciliation Period</label>
            <select className="form-input" style={{ background: 'rgba(255,255,255,0.7)', color: '#0f172a', border: '1px solid rgba(0,0,0,0.1)' }}>
              <option>Current Academic Year</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn" style={{ width: '100%', height: '42px', background: '#6366f1', color: 'white', fontWeight: 600 }}>
              Export PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Trigger Bar */}
      <QuickActions actions={['Waive Fee', 'Send Reminder', 'Add Expense']} />

    </div>
  );
}
