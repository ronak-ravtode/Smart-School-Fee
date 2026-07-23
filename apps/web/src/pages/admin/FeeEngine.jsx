import { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';
import DataTable from '../../components/ui/DataTable';
import StatusChip from '../../components/ui/StatusChip';
import ActionButton from '../../components/ui/ActionButton';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import { Icon } from '../../components/Icon';
import { toast } from '../../components/ui/Toast';

export default function FeeEngine() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', amount: '', type: 'tuition', appliesTo: 'all' });

  const fetch = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/fees/structures', { headers: { Authorization: `Bearer ${token}` } });
      setStructures(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', amount: '', type: 'tuition', appliesTo: 'all' });
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row.id);
    setForm({ name: row.name, amount: row.amount, type: row.type, appliesTo: row.appliesTo });
    setDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      if (editing) {
        await axios.put(`/api/fees/structures/${editing}`, form, { headers });
        toast('Fee structure updated');
      } else {
        await axios.post('/api/fees/structures', {
          ...form,
          amount: Number(form.amount),
          academicYearId: 1,
        }, { headers });
        toast('Fee structure created');
      }
      setDrawerOpen(false);
      fetch();
    } catch (e) {
      toast(e.response?.data?.error || 'Save failed', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (v) => <StatusChip variant="info">{v}</StatusChip> },
    {
      key: 'amount',
      label: 'Amount',
      render: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
    },
    { key: 'appliesTo', label: 'Scope' },
    {
      key: 'version',
      label: 'Version',
      render: (v) => <span className="text-xs text-on-surface-variant">v{v}</span>,
    },
    {
      key: 'action',
      label: '',
      sortable: false,
      action: (row) => (
        <ActionButton variant="ghost" onClick={() => openEdit(row)}>
          <Icon name="edit" className="text-lg" />
        </ActionButton>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Fee Engine"
        title="Fee Structure Management"
        action={
          <ActionButton icon={() => <Icon name="add" className="text-lg" />} onClick={openCreate}>
            Create Fee Structure
          </ActionButton>
        }
      />

      <GlassCard>
        <DataTable
          columns={columns}
          data={structures}
          loading={loading}
          emptyMessage="No fee structures created yet"
        />
      </GlassCard>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Fee Structure' : 'Create Fee Structure'} width="500px">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-black mb-1">Name</label>
            <input className="w-full h-10 px-3 rounded-inputs border border-gray-200 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-black mb-1">Amount (₹)</label>
            <input className="w-full h-10 px-3 rounded-inputs border border-gray-200 text-sm" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-black mb-1">Type</label>
            <select className="w-full h-10 px-3 rounded-inputs border border-gray-200 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="tuition">Tuition</option>
              <option value="transport">Transport</option>
              <option value="late_fee">Late Fee</option>
              <option value="exam_fee">Exam Fee</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-black mb-1">Applies To</label>
            <input className="w-full h-10 px-3 rounded-inputs border border-gray-200 text-sm" value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })} placeholder="e.g. class_10, all" />
          </div>
          <div className="flex gap-3 pt-2">
            <ActionButton type="submit">{editing ? 'Update' : 'Create'}</ActionButton>
            <ActionButton variant="secondary" type="button" onClick={() => setDrawerOpen(false)}>Cancel</ActionButton>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
