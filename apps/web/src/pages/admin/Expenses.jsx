import React, { useState, useEffect } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import ActionButton from '../../components/ui/ActionButton';
import PageHeader from '../../components/ui/PageHeader';
import StatusChip from '../../components/ui/StatusChip';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('other');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const categories = ['watchman', 'cleaning', 'utilities', 'repairs', 'other'];

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.status === 200) {
        setExpenses(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          description,
          amount: Number(amount),
          date,
          category
        })
      });

      const data = await res.json();
      if (res.status === 201) {
        setSuccess('Maintenance expense logged successfully!');
        setDescription('');
        setAmount('');
        fetchExpenses();
      } else {
        setError(data.error || 'Failed to record expense.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Maintenance Expenses"
        title="Operational Expense Log"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <GlassCard className="lg:col-span-1">
          <h2 className="font-medium text-ink-black mb-2">Log Maintenance Expense</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Record school operational expenses (utilities, cleaning, payroll, repairs).
          </p>

          {error && <div className="p-4 rounded-[12px] bg-error-container text-error text-sm mb-4">{error}</div>}
          {success && <div className="p-4 rounded-[12px] bg-success-container text-success text-sm mb-4">{success}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Watchman Salary (July)" required className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Amount (₹)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 15000" required className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black focus:outline-none focus:ring-2 focus:ring-module-dashboard/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-black mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-12 px-4 rounded-inputs border border-gray-200 bg-white text-sm text-ink-black focus:outline-none focus:ring-2 focus:ring-module-dashboard/30">
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <ActionButton type="submit" disabled={loading} className="mt-1">
              {loading ? 'Recording…' : 'Add Expense'}
            </ActionButton>
          </form>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h2 className="font-medium text-ink-black mb-2">Operational Expenses Log</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Showing recent maintenance entries logged by administrators.
          </p>

          {expenses.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant text-sm">
              No expenses recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-on-surface-variant text-xs uppercase tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id} className="border-b border-gray-100">
                      <td className="p-3 text-on-surface-variant">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-ink-black">{expense.description}</td>
                      <td className="p-3">
                        <StatusChip variant="neutral">{expense.category.toUpperCase()}</StatusChip>
                      </td>
                      <td className="p-3 text-right font-bold text-ink-black">₹{Number(expense.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
