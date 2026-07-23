import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  sortable = true,
  onRowClick,
  pageSize = 10,
  emptyMessage = 'No data found',
  emptyIcon,
  className = '',
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState([]);

  const handleSort = (key) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey], bv = b[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const toggleAll = () => {
    if (selected.length === paged.length) {
      setSelected([]);
    } else {
      setSelected(paged.map((_, i) => i + page * pageSize));
    }
  };

  const toggle = (idx) => {
    const globalIdx = idx + page * pageSize;
    setSelected((s) =>
      s.includes(globalIdx) ? s.filter((i) => i !== globalIdx) : [...s, globalIdx]
    );
  };

  if (loading) {
    return (
      <div className={className}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 mb-2 rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} icon={emptyIcon} />;
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={selected.length === paged.length && paged.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider ${col.sortable !== false && sortable ? 'cursor-pointer hover:text-ink-black' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
              ))}
              {columns.some((c) => c.action) && <th className="p-3 w-20" />}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paged.map((row, idx) => (
                <motion.tr
                  key={row.id || idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(idx + page * pageSize)}
                      onChange={() => toggle(idx)}
                      className="rounded"
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="p-3 text-sm text-ink-black">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {columns.find((c) => c.action) && (
                    <td className="p-3">{columns.find((c) => c.action)?.action(row)}</td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-3 border-t border-gray-100">
          <span className="text-xs text-on-surface-variant">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} of {data.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-100"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
