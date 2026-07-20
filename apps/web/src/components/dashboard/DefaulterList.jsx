import React, { useState } from 'react';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import { Icon } from '../Icon';

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function DefaulterList() {
  const [sortBy, setSortBy] = useState('risk');
  const [filterClass, setFilterClass] = useState('');

  const { data: _defaulters, loading } = useDashboardQuery('/api/dashboard/defaulters', { sort_by: sortBy, filter_class: filterClass }, 5000);
  const defaulters = _defaulters ?? [];

  const criticalCount = defaulters.filter(d => (d.default_risk_pct || 10) > 70).length;

  return (
    <div className="flex flex-col">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-headline-md text-headline-md text-ink-black tracking-tight mb-2">Priority Attention Required</h2>
          <p className="font-body text-body text-on-surface-variant">Top accounts requiring immediate follow-up</p>
        </div>
        <div className="hidden md:flex gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-canvas-cream border border-outline-variant/50 rounded-full px-4 py-2 font-nav-button text-nav-button text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-ink-black text-[13px]"
          >
            <option value="risk">Sort by AI Default Risk</option>
            <option value="days">Sort by Days</option>
            <option value="amount">Sort by Amount</option>
          </select>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-canvas-cream border border-outline-variant/50 rounded-full px-4 py-2 font-nav-button text-nav-button text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-ink-black text-[13px]"
          >
            <option value="">All Classes</option>
            <option value="Grade 1-A">Grade 1-A</option>
            <option value="Grade 2-C">Grade 2-C</option>
            <option value="Grade 5-A">Grade 5-A</option>
            <option value="Grade 10-A">Grade 10-A</option>
            <option value="Grade 10-B">Grade 10-B</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-on-surface-variant text-[14px]">Querying defaulter logs…</div>
      ) : defaulters.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant text-[14px]">No student accounts are currently overdue.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {defaulters.slice(0, 3).map((defaulter, idx) => {
            const riskPct = defaulter.default_risk_pct || 10;
            const isCritical = riskPct > 70;
            const initials = getInitials(defaulter.name);
            const waText = encodeURIComponent(
              `Dear parent ${defaulter.guardian_name || 'Guardian'}, this is an urgent reminder from SmartSchool FinTech that the pending fee of INR ${Number(defaulter.overdue_amount).toLocaleString('en-IN')} for your ward ${defaulter.name} is overdue by ${defaulter.overdue_days} days. Please clear it immediately. Thank you!`
            );
            const waUrl = `https://wa.me/${defaulter.guardian_mobile || '919999999999'}?text=${waText}`;
            const overdueColor = defaulter.overdue_days > 60 ? 'bg-error-container text-error' : 'bg-warning-container text-warning';
            const isStaggered = idx === 1 || idx === 3;

            return (
              <div key={idx} className={`relative group flex flex-col items-center ${isStaggered ? 'pt-0 md:pt-12' : ''}`}>
                <div className="w-[240px] h-[240px] md:w-[280px] md:h-[280px] rounded-full overflow-hidden relative bg-surface-container-high flex items-center justify-center shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] mb-6 border-2 border-transparent transition-all duration-500 group-hover:border-light-signal-orange/30">
                  <span className="font-headline-lg-mobile text-[48px] md:font-headline-lg md:text-[64px] text-ink-black/20 font-bold select-none">{initials}</span>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform hover:bg-ink-black hover:text-white text-ink-black"
                  >
                    <Icon name="chat" className="text-[22px]" />
                  </a>
                  {isCritical && (
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-error-container text-error font-nav-button text-[12px] flex items-center gap-1 shadow-md">
                      <Icon name="priority_high" className="text-[14px]" /> HIGH RISK
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h4 className="font-headline-sm text-[20px] text-ink-black mb-1">{defaulter.name}</h4>
                  <p className="font-body text-[14px] text-on-surface-variant mb-2">{defaulter.class} — Parent: {defaulter.guardian_name || 'Unknown'}</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full font-nav-button text-[14px] ${overdueColor}`}>
                    {defaulter.overdue_days} Days Overdue — ₹{Number(defaulter.overdue_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="relative group flex flex-col items-center pt-0 md:pt-12">
            <div className="w-[240px] h-[240px] md:w-[280px] md:h-[280px] rounded-full bg-lifted-cream border border-dust-taupe/30 flex items-center justify-center mb-6 hover:border-ink-black transition-colors cursor-pointer shadow-sm">
              <div className="text-center">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-2">group</span>
                <p className="font-nav-button text-nav-button text-ink-black">View All {criticalCount > 0 ? `${criticalCount} Critical` : `${defaulters.length}`}<br />Flagged Accounts</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-3 mt-6 md:hidden">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-canvas-cream border border-outline-variant/50 rounded-full px-4 py-2 font-nav-button text-nav-button text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-ink-black text-[13px] flex-1"
        >
          <option value="risk">Sort by AI Default Risk</option>
          <option value="days">Sort by Days</option>
          <option value="amount">Sort by Amount</option>
        </select>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="bg-canvas-cream border border-outline-variant/50 rounded-full px-4 py-2 font-nav-button text-nav-button text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-ink-black text-[13px] flex-1"
        >
          <option value="">All Classes</option>
          <option value="Grade 1-A">Grade 1-A</option>
          <option value="Grade 2-C">Grade 2-C</option>
          <option value="Grade 5-A">Grade 5-A</option>
          <option value="Grade 10-A">Grade 10-A</option>
          <option value="Grade 10-B">Grade 10-B</option>
        </select>
      </div>
    </div>
  );
}
