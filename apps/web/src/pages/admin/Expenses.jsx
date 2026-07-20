import React, { useState, useEffect } from 'react';
import { Card, PillButton, InputField, SelectField, Alert, Eyebrow, StatusBadge } from '../../components/ui/Primitives';

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
    <div className="flex flex-col gap-section-sm">
      <header>
        <Eyebrow>Maintenance Expenses</Eyebrow>
        <h1 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight mt-2">
          Operational Expense Log
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Log Expense Form */}
        <Card className="lg:col-span-1">
          <h2 className="font-headline-sm text-headline-sm text-ink-black mb-2">Log Maintenance Expense</h2>
          <p className="font-body text-[14px] text-on-surface-variant mb-6">
            Record school operational expenses (utilities, cleaning, payroll, repairs).
          </p>

          <Alert tone="error">{error}</Alert>
          <Alert tone="success">{success}</Alert>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <InputField
              label="Description"
              id="exp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Watchman Salary (July)"
              required
            />

            <InputField
              label="Amount (₹)"
              id="exp-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 15000"
              required
            />

            <InputField
              label="Date"
              id="exp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <SelectField
              label="Category"
              id="exp-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
              ))}
            </SelectField>

            <PillButton type="submit" disabled={loading} className="mt-1">
              {loading ? 'Recording…' : 'Add Expense'}
            </PillButton>
          </form>
        </Card>

        {/* Expenses History List */}
        <Card className="lg:col-span-2">
          <h2 className="font-headline-sm text-headline-sm text-ink-black mb-2">Operational Expenses Log</h2>
          <p className="font-body text-[14px] text-on-surface-variant mb-6">
            Showing recent maintenance entries logged by administrators.
          </p>

          {expenses.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant text-[14px]">
              No expenses recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-on-surface-variant font-eyebrow text-eyebrow uppercase tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id} className="border-b border-outline-variant/20">
                      <td className="p-3 text-on-surface-variant">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-ink-black">{expense.description}</td>
                      <td className="p-3">
                        <StatusBadge tone="outline">{expense.category.toUpperCase()}</StatusBadge>
                      </td>
                      <td className="p-3 text-right font-bold text-ink-black">₹{Number(expense.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
