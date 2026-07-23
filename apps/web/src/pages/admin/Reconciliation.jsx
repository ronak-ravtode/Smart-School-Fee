import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';
import StatusChip from '../../components/ui/StatusChip';
import ActionButton from '../../components/ui/ActionButton';
import DataTable from '../../components/ui/DataTable';
import { Icon } from '../../components/Icon';
import { toast } from '../../components/ui/Toast';
import axios from 'axios';

export default function Reconciliation() {
  const [csvText, setCsvText] = useState('');
  const [matched, setMatched] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleReconcile = async () => {
    if (!csvText.trim()) { toast('Paste CSV data first', 'error'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/reconciliation/upload', { csvText }, { headers: { Authorization: `Bearer ${token}` } });
      setMatched(res.data.matched || []);
      setUnmatched(res.data.unmatched || []);
      toast(`Matched ${res.data.matched?.length || 0}, Unmatched ${res.data.unmatched?.length || 0}`);
    } catch (e) {
      toast(e.response?.data?.error || 'Reconciliation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const matchColumns = [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount', render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    { key: 'studentName', label: 'Student' },
    { key: 'receiptNumber', label: 'Receipt', render: (v) => v || '—' },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Reconciliation"
        title="Bank Statement Matching"
        subtitle="Upload CSV to auto-match deposits with system records"
        action={
          <div className="flex gap-2">
            <ActionButton onClick={handleReconcile} disabled={loading}>
              {loading ? 'Processing...' : 'Run Reconciliation'}
            </ActionButton>
            <ActionButton variant="secondary" icon={() => <Icon name="download" className="text-lg" />}>Export</ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <GlassCard className="lg:col-span-3">
          <h3 className="text-sm font-medium text-ink-black mb-3">Paste CSV Data</h3>
          <p className="text-xs text-on-surface-variant mb-3">Format: date,amount,description (one per line)</p>
          <textarea
            className="w-full h-40 p-4 rounded-[12px] border border-gray-200 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-module-reconciliation/30"
            placeholder={"2026-07-18,25000,Tuition fee deposit\n2026-07-18,65000,Transport fee"}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
        </GlassCard>

        <GlassCard className="lg:col-span-2 flex flex-col justify-center items-center text-center">
          <div className="text-3xl font-semibold text-success">{matched.length}</div>
          <p className="text-sm text-on-surface-variant">Matched</p>
          <div className="text-3xl font-semibold mt-4" style={{ color: '#e8977a' }}>{unmatched.length}</div>
          <p className="text-sm text-on-surface-variant">Unmatched</p>
        </GlassCard>
      </div>

      {matched.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-sm font-medium text-success mb-4">Matched ({matched.length})</h3>
            <DataTable columns={matchColumns} data={matched} emptyMessage="No matches" />
          </GlassCard>
          <GlassCard>
            <h3 className="text-sm font-medium mb-4" style={{ color: '#e8977a' }}>Unmatched ({unmatched.length})</h3>
            <DataTable columns={matchColumns} data={unmatched} emptyMessage="All matched!" />
          </GlassCard>
        </div>
      )}
    </div>
  );
}
