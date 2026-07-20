import React, { useState } from 'react';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import { Icon } from '../../components/Icon';

export default function Reports() {
  const [classFilter, setClassFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: report, loading } = useDashboardQuery('/api/dashboard/reports', { class: classFilter, start_date: startDate, end_date: endDate }, 5000);

  const handleExportCSV = () => {
    if (!report) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'SMART SCHOOL FINTECH - REVENUE & COLLECTION LEDGER REPORT\r\n';
    csvContent += `Generated On,${new Date().toLocaleString()}\r\n`;
    csvContent += `Filters,Class: ${classFilter || 'All Standards'}, Start Date: ${startDate || 'N/A'}, End Date: ${endDate || 'N/A'}\r\n\r\n`;
    csvContent += 'FINANCIAL LEDGER SUMMARY\r\n';
    csvContent += `Total Revenue Collected,INR ${Number(report.total_collected).toFixed(2)}\r\n`;
    csvContent += `Total Pending Balances,INR ${Number(report.total_pending).toFixed(2)}\r\n\r\n`;
    csvContent += 'COLLECTION BREAKDOWN BY CATEGORY\r\n';
    csvContent += 'Fee Category,Collected Amount (INR)\r\n';
    if (report.breakdown && report.breakdown.length > 0) {
      report.breakdown.forEach((item) => {
        csvContent += `${item.type.toUpperCase()},${Number(item.total).toFixed(2)}\r\n`;
      });
    } else {
      csvContent += 'No category breakdown available for current filter set\r\n';
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartSchool_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-lifted-cream rounded-frame p-card-padding shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] border border-white/40 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-ink-black">Revenue & Collection Reports</h2>
          <p className="font-body text-body text-on-surface-variant text-[14px] mt-1">Generate, filter, and review ledger balances by academic period and grade.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!report || loading}
          className="inline-flex items-center gap-2 bg-ink-black text-canvas-cream rounded-full px-5 h-11 font-nav-button text-nav-button text-[14px] hover:bg-inverse-surface transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange"
        >
          <Icon name="download" className="text-[18px]" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider text-[12px]">Class / Grade</label>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-11 px-4 rounded-full bg-canvas-cream border border-outline-variant/50 font-body text-body text-ink-black focus:outline-none focus:ring-1 focus:ring-ink-black">
            <option value="">All Standards</option>
            <option value="Grade 1-A">Grade 1-A</option>
            <option value="Grade 2-C">Grade 2-C</option>
            <option value="Grade 5-A">Grade 5-A</option>
            <option value="Grade 10-A">Grade 10-A</option>
            <option value="Grade 10-B">Grade 10-B</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider text-[12px]">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 px-4 rounded-full bg-canvas-cream border border-outline-variant/50 font-body text-body text-ink-black focus:outline-none focus:ring-1 focus:ring-ink-black" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-eyebrow text-eyebrow text-light-signal-orange uppercase tracking-wider text-[12px]">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 px-4 rounded-full bg-canvas-cream border border-outline-variant/50 font-body text-body text-ink-black focus:outline-none focus:ring-1 focus:ring-ink-black" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-on-surface-variant text-[14px]">Generating report data…</div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#E8F5E9] p-6 rounded-[24px]">
              <span className="font-eyebrow text-eyebrow uppercase tracking-widest text-[12px] text-success">Total Revenue Collected</span>
              <p className="font-headline-sm text-headline-sm text-ink-black mt-2">₹{Number(report?.total_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#FFEBEE] p-6 rounded-[24px]">
              <span className="font-eyebrow text-eyebrow uppercase tracking-widest text-[12px] text-error">Total Pending Balances</span>
              <p className="font-headline-sm text-headline-sm text-ink-black mt-2">₹{Number(report?.total_pending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div>
            <h3 className="font-nav-button text-nav-button text-ink-black mb-3">Collection Breakdown by Fee Category</h3>
            {!report?.breakdown || report.breakdown.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant text-[14px] bg-surface-container-low rounded-[20px]">No categorized collections found within this query range.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-dust-taupe/30">
                      <th className="font-eyebrow text-eyebrow text-on-surface-variant uppercase tracking-wider py-3">Fee Type</th>
                      <th className="font-eyebrow text-eyebrow text-on-surface-variant uppercase tracking-wider py-3 text-right">Amount Collected</th>
                    </tr>
                  </thead>
                  <tbody className="font-body text-body text-ink-black divide-y divide-dust-taupe/15">
                    {report.breakdown.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-medium uppercase">{item.type}</td>
                        <td className="py-3 text-right font-medium">₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
