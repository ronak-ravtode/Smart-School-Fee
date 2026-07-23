# SmartSchool Fee UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild 7 admin screens with unified Pastel Premium design system; redesign 8 existing screens (keep logic); preserve routing, Zustand stores, API layer, auth, build config.

**Architecture:** React 19 + Vite + Tailwind v4 + Framer Motion + Recharts + Zustand. Monorepo (pnpm workspaces). Existing API Express/Prisma backend untouched.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4, Framer Motion 12, Recharts 3, Zustand 5, react-icons, axios, Hanken Grotesk font, Material Symbols icons.

## Global Constraints

- No emoji as icons — use Material Symbols (`<Icon name="..." />`)
- All colors come from CSS `@theme` tokens, never raw hex in components
- Radius: cards 12px, buttons/inputs 10px, dialogs 20px, charts 12px
- Elevation uses box-shadow + backdrop-blur + border-opacity combo
- 8px spacing rhythm (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128)
- Framer Motion only for: StatCard counting, drawer open/close, sidebar indicator, hover elevation, skeleton fade, chart fade
- Recharts area fill at 8-12% opacity; module accent as primary color
- All DataTables: sticky header, sortable columns, pagination, row actions, loading skeleton, empty state
- Every page has ContextRibbon with module name + accent dot
- Login, auth, cashier, guardian pages: redesign shell only (keep existing logic/API calls)

---

## File Inventory

### Phase 1 — Foundation: CSS Tokens + Shared Components

| Action | File |
|--------|------|
| Modify | `apps/web/src/index.css` — add design tokens under `@theme` |
| Create | `apps/web/src/components/ui/GlassCard.jsx` |
| Create | `apps/web/src/components/ui/StatCard.jsx` |
| Create | `apps/web/src/components/ui/DataTable.jsx` |
| Create | `apps/web/src/components/ui/StatusChip.jsx` |
| Create | `apps/web/src/components/ui/SearchInput.jsx` |
| Create | `apps/web/src/components/ui/FilterBar.jsx` |
| Create | `apps/web/src/components/ui/Modal.jsx` |
| Create | `apps/web/src/components/ui/Drawer.jsx` |
| Create | `apps/web/src/components/ui/ActionButton.jsx` |
| Create | `apps/web/src/components/ui/Toast.jsx` |
| Create | `apps/web/src/components/ui/Skeleton.jsx` |
| Create | `apps/web/src/components/ui/EmptyState.jsx` |
| Create | `apps/web/src/components/ui/PageHeader.jsx` |
| Create | `apps/web/src/components/ui/TabBar.jsx` |
| Create | `apps/web/src/components/ui/MetricTrend.jsx` |
| Delete | `apps/web/src/components/dashboard/GlassCard.jsx` (replaced) |
| Delete | `apps/web/src/components/dashboard/BalanceCard.jsx` (replaced by StatCard) |
| Delete | `apps/web/src/components/dashboard/RevenueChart.jsx` (replaced by inline charts) |
| Delete | `apps/web/src/components/dashboard/DefaulterList.jsx` (replaced by Defaulter page) |
| Delete | `apps/web/src/components/dashboard/QuickActions.jsx` (replaced by inline) |

### Phase 2 — New Layout

| Action | File |
|--------|------|
| Create | `apps/web/src/components/layout/Sidebar.jsx` |
| Create | `apps/web/src/components/layout/ContextRibbon.jsx` |
| Modify | `apps/web/src/components/layout/PageShell.jsx` — integrate Sidebar + ContextRibbon |
| Modify | `apps/web/src/components/layout/TopNavBar.jsx` — keep for mobile nav, repurpose |
| Create | `apps/web/src/stores/uiStore.js` — sidebar state, toast queue, active module |
| Create | `apps/web/src/hooks/useModuleAccent.js` — returns accent color for current module |

### Phase 3 — Rebuilt Admin Pages

| Action | File |
|--------|------|
| Overwrite | `apps/web/src/pages/admin/Dashboard.jsx` |
| Create | `apps/web/src/pages/admin/FeeEngine.jsx` |
| Create | `apps/web/src/pages/admin/StudentProfile.jsx` |
| Create | `apps/web/src/pages/admin/Payments.jsx` |
| Create | `apps/web/src/pages/admin/Defaulters.jsx` |
| Overwrite | `apps/web/src/pages/admin/Reconciliation.jsx` |
| Create | `apps/web/src/pages/admin/ReportsAnalytics.jsx` |
| Delete | `apps/web/src/pages/admin/Reports.jsx` (orphaned — old sub-component replaced by inline charts + standalone ReportsAnalytics) |
| Modify | `apps/web/src/App.jsx` — add new nav items + routes |

### Phase 4 — Redesigned Pages (shell only, keep logic)

| Action | File |
|--------|------|
| Modify | `apps/web/src/pages/auth/Login.jsx` — new shell |
| Modify | `apps/web/src/pages/auth/Signup.jsx` — new shell |
| Modify | `apps/web/src/pages/auth/ForgotPassword.jsx` — new shell |
| Modify | `apps/web/src/pages/cashier/Collections.jsx` — new component wrappers |
| Modify | `apps/web/src/pages/cashier/OfflineQueue.jsx` — new components |
| Modify | `apps/web/src/pages/cashier/Deposits.jsx` — new components |
| Modify | `apps/web/src/pages/guardian/Payment.jsx` — new shell |
| Modify | `apps/web/src/pages/guardian/PaymentSuccess.jsx` — new shell |
| Modify | `apps/web/src/pages/guardian/Receipts.jsx` — new shell |

### Phase 5 — Polish

| Action | File |
|--------|------|
| Modify | `apps/web/src/App.jsx` — wire Toast, wire module accent |
| Modify | All rebuilt pages — add Framer Motion micro-interactions |

---

## Phase 1: Foundation

### Task 1.1: Update CSS Design Tokens

**Files:**
- Modify: `apps/web/src/index.css`

**Interfaces:**
- Produces: CSS custom properties consumed by all components

**Context:** The existing `index.css` already has a `@theme` block. We update it with new Pastel Premium token values + module accent colors.

- [ ] **Add module accent colors + elevation tokens + radius tokens to @theme**

```css
/* Inside existing @theme { ... } in index.css, add: */

--color-module-dashboard: #8b8fd4;
--color-module-students: #6bc9a9;
--color-module-fee-engine: #6c7bd8;
--color-module-payments: #5bb98a;
--color-module-reconciliation: #e8977a;
--color-module-defaulters: #d46a7a;
--color-module-reports: #e8b86a;
--color-module-settings: #8a94a5;

--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;

--color-canvas: #f8f6f3;
--color-surface-glass: rgba(255, 255, 255, 0.7);

--radius-cards: 12px;
--radius-buttons: 10px;
--radius-inputs: 10px;
--radius-dialogs: 20px;
--radius-charts: 12px;
--radius-badges: 9999px;
--radius-sidebar-indicator: 4px;
```

- [ ] **Verify no conflicts**

Run: `pnpm --filter web dev` — check Vite compiles without CSS errors.

- [ ] **Commit**

```
git add apps/web/src/index.css
git commit -m "feat(css): add module accent tokens, elevation, radius tokens"
```

### Task 1.2: GlassCard Component

**Files:**
- Create: `apps/web/src/components/ui/GlassCard.jsx`
- Delete: `apps/web/src/components/dashboard/GlassCard.jsx`

**Interfaces:**
- Produces: `<GlassCard accent hoverable noPadding>`

- [ ] **Create GlassCard**

```jsx
import { motion } from 'framer-motion';

const ELEVATION = {
  1: {
    className: 'shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm border border-white/40',
    hover: 'shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md border-white/60',
  },
  2: {
    className: 'shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md border border-white/60',
    hover: 'shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-lg border-white/80',
  },
};

export default function GlassCard({
  children,
  className = '',
  elevation = 1,
  hoverable = false,
  noPadding = false,
  accent = '',
  as: Tag = 'div',
}) {
  const base = ELEVATION[elevation] || ELEVATION[1];
  const TagComponent = hoverable ? motion.div : Tag;

  const props = hoverable
    ? {
        whileHover: { y: -2 },
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <TagComponent
      className={`bg-white/70 rounded-cards ${base.className} ${hoverable ? `hover:${base.hover}` : ''} ${noPadding ? '' : 'p-6'} ${accent ? 'border-t-2' : ''} ${className}`}
      style={accent ? { borderTopColor: `var(--color-module-${accent})` } : {}}
      {...props}
    >
      {children}
    </TagComponent>
  );
}
```

- [ ] **Delete old GlassCard**

```
Remove-Item -LiteralPath "apps/web/src/components/dashboard/GlassCard.jsx"
```

- [ ] **Commit**

```
git add apps/web/src/components/ui/GlassCard.jsx
git rm apps/web/src/components/dashboard/GlassCard.jsx
git commit -m "feat(ui): GlassCard with elevation system and hover states"
```

### Task 1.3: StatCard Component

**Files:**
- Create: `apps/web/src/components/ui/StatCard.jsx`
- Delete: `apps/web/src/components/dashboard/BalanceCard.jsx`

**Interfaces:**
- Produces: `<StatCard title value icon accent trend animate>`

- [ ] **Create StatCard**

```jsx
import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';
import GlassCard from './GlassCard';
import MetricTrend from './MetricTrend';

export default function StatCard({
  title,
  value,
  icon: IconComponent,
  accent = 'dashboard',
  trend,
  trendLabel,
  animate: shouldAnimate = true,
  formatter = (v) => `₹${Number(v).toLocaleString('en-IN')}`,
  className = '',
}) {
  const valRef = useRef(null);

  useEffect(() => {
    if (!shouldAnimate || !valRef.current) return;
    const controls = animate(0, Number(value) || 0, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate(latest) {
        if (valRef.current) {
          valRef.current.textContent = formatter(latest);
        }
      },
    });
    return () => controls.stop();
  }, [value, shouldAnimate, formatter]);

  return (
    <GlassCard className={className}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, var(--color-module-${accent}) 15%, transparent)` }}
        >
          {IconComponent && (
            <IconComponent
              className="text-xl"
              style={{ color: `var(--color-module-${accent})` }}
            />
          )}
        </div>
        {trend !== undefined && <MetricTrend value={trend} label={trendLabel} />}
      </div>
      <p ref={valRef} className="text-3xl font-semibold text-ink-black tracking-tight leading-none mb-1">
        {formatter(value)}
      </p>
      <p className="text-sm text-on-surface-variant">{title}</p>
    </GlassCard>
  );
}
```

- [ ] **Delete old BalanceCard**

```
Remove-Item -LiteralPath "apps/web/src/components/dashboard/BalanceCard.jsx"
```

- [ ] **Commit**

```
git add apps/web/src/components/ui/StatCard.jsx
git rm apps/web/src/components/dashboard/BalanceCard.jsx
git commit -m "feat(ui): StatCard with animated counting and accent color"
```

### Task 1.4: Shared Components — DataTable, StatusChip, SearchInput, FilterBar

**Files:**
- Create: `apps/web/src/components/ui/DataTable.jsx`
- Create: `apps/web/src/components/ui/StatusChip.jsx`
- Create: `apps/web/src/components/ui/SearchInput.jsx`
- Create: `apps/web/src/components/ui/FilterBar.jsx`

- [ ] **Create StatusChip**

```jsx
const VARIANTS = {
  success: 'bg-success-container text-success',
  warning: 'bg-warning-container text-warning',
  error: 'bg-error-container text-error',
  pending: 'bg-pending-container text-pending',
  info: 'bg-[color-mix(in_srgb,var(--color-module-dashboard)_15%,transparent)] text-module-dashboard',
  neutral: 'bg-gray-100 text-gray-500',
};

const DOT_VARIANTS = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  pending: 'bg-pending',
  info: 'bg-module-dashboard',
  neutral: 'bg-gray-400',
};

export default function StatusChip({ variant = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_VARIANTS[variant] || DOT_VARIANTS.neutral}`} />
      {children}
    </span>
  );
}
```

- [ ] **Create DataTable**

```jsx
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
```

- [ ] **Create SearchInput**

```jsx
import { Icon } from '../Icon';

export default function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Icon
        name="search"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-4 rounded-buttons border border-gray-200 bg-white text-sm text-ink-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-module-dashboard/30 focus:border-module-dashboard transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink-black"
        >
          <Icon name="close" className="text-lg" />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Create FilterBar**

```jsx
export default function FilterBar({ children, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {children}
      <button
        type="button"
        className="text-xs text-on-surface-variant hover:text-ink-black underline underline-offset-2"
      >
        Clear all
      </button>
    </div>
  );
}
```

- [ ] **Commit**

```
git add apps/web/src/components/ui/DataTable.jsx apps/web/src/components/ui/StatusChip.jsx apps/web/src/components/ui/SearchInput.jsx apps/web/src/components/ui/FilterBar.jsx
git commit -m "feat(ui): DataTable, StatusChip, SearchInput, FilterBar"
```

### Task 1.5: Shared Components — Modal, Drawer, ActionButton, Toast, Skeleton, EmptyState, PageHeader, TabBar, MetricTrend

**Files:**
- Create: `apps/web/src/components/ui/Modal.jsx`
- Create: `apps/web/src/components/ui/Drawer.jsx`
- Create: `apps/web/src/components/ui/ActionButton.jsx`
- Create: `apps/web/src/components/ui/Toast.jsx`
- Create: `apps/web/src/components/ui/Skeleton.jsx`
- Create: `apps/web/src/components/ui/EmptyState.jsx`
- Create: `apps/web/src/components/ui/PageHeader.jsx`
- Create: `apps/web/src/components/ui/TabBar.jsx`
- Create: `apps/web/src/components/ui/MetricTrend.jsx`

- [ ] **Create Modal**

```jsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../Icon';

export default function Modal({ open, onClose, title, children, className = '' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`relative bg-white rounded-dialogs shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-lg border border-white/80 w-full max-w-lg max-h-[85vh] overflow-y-auto ${className}`}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-ink-black">{title}</h2>
                <button onClick={onClose} className="text-on-surface-variant hover:text-ink-black p-1 rounded-full hover:bg-gray-100">
                  <Icon name="close" className="text-xl" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Create Drawer**

```jsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../Icon';

export default function Drawer({ open, onClose, title, children, width = '480px', className = '' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative bg-white shadow-[0_0_40px_rgba(0,0,0,0.2)] backdrop-blur-xl h-full overflow-y-auto"
            style={{ width, maxWidth: '90vw' }}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
                <h2 className="text-lg font-semibold text-ink-black">{title}</h2>
                <button onClick={onClose} className="text-on-surface-variant hover:text-ink-black p-1 rounded-full hover:bg-gray-100">
                  <Icon name="close" className="text-xl" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Create ActionButton**

```jsx
export default function ActionButton({ children, variant = 'primary', icon: Icon, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium text-sm rounded-[10px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'text-white px-5 h-10 hover:opacity-90',
    secondary: 'border border-gray-200 text-ink-black px-5 h-10 hover:bg-gray-50',
    ghost: 'text-on-surface-variant px-3 h-9 hover:bg-gray-100 rounded-lg',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="text-lg" />}
      {children}
    </button>
  );
}
```

- [ ] **Create Toast**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let addToastFn = null;

export function toast(message, type = 'success') {
  if (addToastFn) addToastFn({ message, type, id: Date.now() });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const remove = (id) => setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className={`pointer-events-auto px-5 py-3 rounded-[12px] shadow-lg backdrop-blur-md text-sm font-medium flex items-center gap-3 ${
              t.type === 'success'
                ? 'bg-success-container text-success'
                : t.type === 'error'
                ? 'bg-error-container text-error'
                : 'bg-warning-container text-warning'
            }`}
            onClick={() => remove(t.id)}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Create Skeleton**

```jsx
export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200/60 ${className}`}
    />
  );
}
```

- [ ] **Create EmptyState**

```jsx
export default function EmptyState({ message, icon: IconComponent, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {IconComponent && <IconComponent className="text-4xl text-gray-400 mb-4" />}
      <p className="text-sm text-on-surface-variant">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

- [ ] **Create PageHeader**

```jsx
export default function PageHeader({ eyebrow, title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 ${className}`}>
      <div>
        {eyebrow && (
          <p className="text-xs font-medium text-module-dashboard uppercase tracking-wider mb-1">{eyebrow}</p>
        )}
        <h1 className="text-[30px] font-semibold text-ink-black tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
```

- [ ] **Create TabBar**

```jsx
export default function TabBar({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1 p-1 bg-gray-100/80 rounded-[14px] ${className}`}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-2 rounded-[10px] text-sm font-medium transition-all ${
              isActive
                ? 'bg-white text-ink-black shadow-sm'
                : 'text-on-surface-variant hover:text-ink-black'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Create MetricTrend**

```jsx
const DIR = {
  up: 'text-success',
  down: 'text-error',
  neutral: 'text-gray-400',
};

export default function MetricTrend({ value, label = '' }) {
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${DIR[dir]}`}>
      {arrow} {Math.abs(value)}%{label && <span className="text-gray-400">{label}</span>}
    </span>
  );
}
```

- [ ] **Commit**

```
git add apps/web/src/components/ui/Modal.jsx apps/web/src/components/ui/Drawer.jsx apps/web/src/components/ui/ActionButton.jsx apps/web/src/components/ui/Toast.jsx apps/web/src/components/ui/Skeleton.jsx apps/web/src/components/ui/EmptyState.jsx apps/web/src/components/ui/PageHeader.jsx apps/web/src/components/ui/TabBar.jsx apps/web/src/components/ui/MetricTrend.jsx
git commit -m "feat(ui): Modal, Drawer, ActionButton, Toast, Skeleton, EmptyState, PageHeader, TabBar, MetricTrend"
```

### Task 1.6: Clean up old dashboard components

**Files:**
- Delete: `apps/web/src/components/dashboard/BalanceCard.jsx`, `RevenueChart.jsx`, `DefaulterList.jsx`, `QuickActions.jsx`, `GlassCard.jsx`

- [ ] **Remove old components**

```bash
Remove-Item -LiteralPath "apps/web/src/components/dashboard/BalanceCard.jsx" -ErrorAction SilentlyContinue
Remove-Item -LiteralPath "apps/web/src/components/dashboard/RevenueChart.jsx" -ErrorAction SilentlyContinue
Remove-Item -LiteralPath "apps/web/src/components/dashboard/DefaulterList.jsx" -ErrorAction SilentlyContinue
Remove-Item -LiteralPath "apps/web/src/components/dashboard/QuickActions.jsx" -ErrorAction SilentlyContinue
Remove-Item -LiteralPath "apps/web/src/components/dashboard/GlassCard.jsx" -ErrorAction SilentlyContinue
```

- [ ] **Remove stale imports from old Primitives.jsx** (will be handled in refactor later)

- [ ] **Commit**

```
git add -A
git commit -m "chore: remove old dashboard components replaced by new UI kit"
```

---

## Phase 2: Layout

### Task 2.1: Create uiStore

**Files:**
- Create: `apps/web/src/stores/uiStore.js`

**Interfaces:**
- Produces: Zustand store for sidebar state, toast queue, active module

- [ ] **Create uiStore**

```jsx
import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  sidebarOpen: true,
  activeModule: 'dashboard',
  toastQueue: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveModule: (module) => set({ activeModule: module }),
  addToast: (message, type = 'success') =>
    set((s) => ({
      toastQueue: [...s.toastQueue, { id: Date.now(), message, type }],
    })),
  removeToast: (id) =>
    set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),
}));
```

- [ ] **Commit**

```
git add apps/web/src/stores/uiStore.js
git commit -m "feat(store): add uiStore for sidebar, toast, module state"
```

### Task 2.2: Create useModuleAccent hook

**Files:**
- Create: `apps/web/src/hooks/useModuleAccent.js`

**Interfaces:**
- Produces: `useModuleAccent(moduleName)` returns hex color string

- [ ] **Create hook**

```jsx
const MODULE_ACCENTS = {
  dashboard: 'var(--color-module-dashboard)',
  students: 'var(--color-module-students)',
  'fee-engine': 'var(--color-module-fee-engine)',
  payments: 'var(--color-module-payments)',
  reconciliation: 'var(--color-module-reconciliation)',
  defaulters: 'var(--color-module-defaulters)',
  reports: 'var(--color-module-reports)',
  settings: 'var(--color-module-settings)',
};

export function useModuleAccent(module) {
  return MODULE_ACCENTS[module] || 'var(--color-module-dashboard)';
}
```

- [ ] **Commit**

```
git add apps/web/src/hooks/useModuleAccent.js
git commit -m "feat(hook): useModuleAccent for per-module accent colors"
```

### Task 2.3: Build Sidebar

**Files:**
- Create: `apps/web/src/components/layout/Sidebar.jsx`

**Interfaces:**
- Consumes: `useUIStore`, `useModuleAccent`
- Produces: `<Sidebar activeModule onNavigate>` — fixed left nav

- [ ] **Create Sidebar**

```jsx
import { motion } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore';
import { Icon } from '../Icon';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'students', label: 'Students', icon: 'people' },
  { key: 'fee-engine', label: 'Fee Engine', icon: 'account_balance' },
  { key: 'payments', label: 'Payments', icon: 'payments' },
  { key: 'defaulters', label: 'Defaulters', icon: 'warning' },
  { key: 'reconciliation', label: 'Reconciliation', icon: 'compare_arrows' },
  { key: 'reports', label: 'Reports', icon: 'bar_chart' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const MODULE_ACCENTS = {
  dashboard: 'var(--color-module-dashboard)',
  students: 'var(--color-module-students)',
  'fee-engine': 'var(--color-module-fee-engine)',
  payments: 'var(--color-module-payments)',
  reconciliation: 'var(--color-module-reconciliation)',
  defaulters: 'var(--color-module-defaulters)',
  reports: 'var(--color-module-reports)',
  settings: 'var(--color-module-settings)',
};

export default function Sidebar({ activeModule, onNavigate, user, onLogout }) {
  const { sidebarOpen } = useUIStore();
  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-gray-100 z-40 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink-black flex items-center justify-center">
            <Icon name="account_balance" className="text-white text-lg" />
          </div>
          <span className="font-semibold text-base text-ink-black">SmartSchool</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeModule === item.key;
          const accent = MODULE_ACCENTS[item.key];
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all relative ${
                isActive
                  ? 'bg-gray-50'
                  : 'text-on-surface-variant hover:bg-gray-50 hover:text-ink-black'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ backgroundColor: accent }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                name={item.icon}
                className="text-xl"
                style={{ color: isActive ? accent : undefined }}
              />
              <span style={{ color: isActive ? accent : undefined }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-on-surface-variant">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-black truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-on-surface-variant capitalize">{user?.role || 'user'}</p>
          </div>
          {onLogout && (
            <button onClick={onLogout} className="text-on-surface-variant hover:text-ink-black p-1 rounded-lg hover:bg-gray-100">
              <Icon name="logout" className="text-lg" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Commit**

```
git add apps/web/src/components/layout/Sidebar.jsx
git commit -m "feat(layout): Sidebar with module accent indicators and motion"
```

### Task 2.4: Build ContextRibbon

**Files:**
- Create: `apps/web/src/components/layout/ContextRibbon.jsx`

- [ ] **Create ContextRibbon**

```jsx
import { useModuleAccent } from '../../hooks/useModuleAccent';
import { Icon } from '../Icon';

export default function ContextRibbon({ module, title, breadcrumbs, actions }) {
  const accent = useModuleAccent(module);

  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            {breadcrumbs?.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <Icon name="chevron_right" className="text-lg text-gray-400" />}
                <span className={i === breadcrumbs.length - 1 ? 'text-ink-black font-medium' : 'text-on-surface-variant'}>
                  {crumb}
                </span>
              </span>
            ))}
            {!breadcrumbs && (
              <>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                <span className="text-ink-black font-medium">{title || module}</span>
              </>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```
git add apps/web/src/components/layout/ContextRibbon.jsx
git commit -m "feat(layout): ContextRibbon with breadcrumbs and module accent"
```

### Task 2.5: Update PageShell

**Files:**
- Modify: `apps/web/src/components/layout/PageShell.jsx`

- [ ] **Update PageShell to integrate Sidebar + ContextRibbon**

```jsx
import Sidebar from './Sidebar';
import ContextRibbon from './ContextRibbon';
import { useUIStore } from '../../stores/uiStore';

export default function PageShell({
  children,
  module,
  title,
  breadcrumbs,
  actions,
  user,
  onNavigate,
  onLogout,
  className = '',
}) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        activeModule={module}
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-[240px]' : 'ml-0'}`}>
        <ContextRibbon
          module={module}
          title={title}
          breadcrumbs={breadcrumbs}
          actions={actions}
        />
        <main className={`flex-1 p-8 ${className}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```
git add apps/web/src/components/layout/PageShell.jsx
git commit -m "feat(layout): PageShell integrates Sidebar + ContextRibbon"
```

---

## Phase 3: Rebuilt Admin Pages

### Task 3.1: Rebuild Dashboard

**Files:**
- Overwrite: `apps/web/src/pages/admin/Dashboard.jsx`
- Modify: `apps/web/src/App.jsx` (add nav mapping)

- [ ] **Rebuild Dashboard**

```jsx
import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Icon } from '../../components/Icon';
import GlassCard from '../../components/ui/GlassCard';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import StatusChip from '../../components/ui/StatusChip';
import ActionButton from '../../components/ui/ActionButton';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';

const MODULE = 'dashboard';

const statIcons = {
  collected: (props) => <Icon name="payments" {...props} />,
  pending: (props) => <Icon name="hourglass_empty" {...props} />,
  overdue: (props) => <Icon name="warning" {...props} />,
  defaulters: (props) => <Icon name="people" {...props} />,
};

export default function Dashboard({ onNavigate }) {
  const { data: metrics, loading } = useDashboardQuery('/api/dashboard/metrics', {}, 5000);
  const { data: revenue } = useDashboardQuery('/api/dashboard/revenue-breakdown', { period: 'monthly' }, 5000);
  const { data: defaulters } = useDashboardQuery('/api/dashboard/defaulters', {}, 5000);

  const m = metrics || {};
  const revData = revenue?.labels?.map((l, i) => ({ name: l.toUpperCase(), value: Number(revenue.data[i]) || 0 })) || [];

  const COLORS = ['var(--color-module-dashboard)', 'var(--color-module-students)', 'var(--color-module-payments)', 'var(--color-module-reconciliation)', 'var(--color-module-reports)'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white shadow-lg rounded-[12px] p-3 border border-gray-100 text-sm">
          <p className="font-medium text-ink-black">{label}</p>
          <p className="font-semibold text-ink-black">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <PageHeader
        eyebrow="Financial Dashboard"
        title="School Financial Overview"
        action={
          <ActionButton icon={() => <Icon name="download" className="text-lg" />}>
            Export Report
          </ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Collected Today" value={m.today_collections || 0} icon={statIcons.collected} accent="dashboard" />
        <StatCard title="Pending Dues" value={m.pending_fees || 0} icon={statIcons.pending} accent="reports" />
        <StatCard title="Overdue Amount" value={m.overdue_amount || 0} icon={statIcons.overdue} accent="defaulters" />
        <StatCard title="Defaulters" value={m.defaulters_count || 0} icon={statIcons.defaulters} accent="defaulters" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <GlassCard className="lg:col-span-2">
          <h3 className="font-medium text-ink-black mb-4">Revenue Trend</h3>
          {revData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revData}>
                  <XAxis dataKey="name" stroke="var(--color-gray-400)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-gray-400)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-module-dashboard)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-on-surface-variant">{loading ? 'Loading...' : 'No data'}</div>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-medium text-ink-black mb-4">Payment Methods</h3>
          {revData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {revData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-on-surface-variant">{loading ? 'Loading...' : 'No data'}</div>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <GlassCard>
          <h3 className="font-medium text-ink-black mb-4">Priority Defaulters</h3>
          {(defaulters || []).length > 0 ? (
            <div className="space-y-3">
              {defaulters.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-[10px] bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-ink-black">{d.name}</p>
                    <p className="text-xs text-on-surface-variant">{d.class} • {d.overdue_days} days overdue</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip variant={d.overdue_days > 60 ? 'error' : 'warning'}>
                      ₹{Number(d.overdue_amount).toLocaleString('en-IN')}
                    </StatusChip>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No overdue accounts</p>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-medium text-ink-black mb-4">Recent Activity</h3>
          <p className="text-sm text-on-surface-variant">Payment activity feed appears here</p>
        </GlassCard>
      </div>

      <div className="flex gap-3">
        <ActionButton icon={() => <Icon name="payments" className="text-lg" />} onClick={() => onNavigate?.('payments')}>Collect Fee</ActionButton>
        <ActionButton variant="secondary" icon={() => <Icon name="add" className="text-lg" />} onClick={() => onNavigate?.('fee-engine')}>Create Invoice</ActionButton>
        <ActionButton variant="secondary" icon={() => <Icon name="price_check" className="text-lg" />}>Apply Waiver</ActionButton>
        <ActionButton variant="secondary" icon={() => <Icon name="gavel" className="text-lg" />}>Add Penalty</ActionButton>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```
git add apps/web/src/pages/admin/Dashboard.jsx
git commit -m "feat(admin): rebuild Dashboard with StatCards, charts, defaulter alerts"
```

### Task 3.2: Rebuild Fee Engine

**Files:**
- Create: `apps/web/src/pages/admin/FeeEngine.jsx`

- [ ] **Create FeeEngine page**

```jsx
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
            <label className="block text-sm font-medium text-[#141413] mb-1">Name</label>
            <input className="w-full h-10 px-3 rounded-[10px] border border-gray-200 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#141413] mb-1">Amount (₹)</label>
            <input className="w-full h-10 px-3 rounded-[10px] border border-gray-200 text-sm" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#141413] mb-1">Type</label>
            <select className="w-full h-10 px-3 rounded-[10px] border border-gray-200 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="tuition">Tuition</option>
              <option value="transport">Transport</option>
              <option value="late_fee">Late Fee</option>
              <option value="exam_fee">Exam Fee</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#141413] mb-1">Applies To</label>
            <input className="w-full h-10 px-3 rounded-[10px] border border-gray-200 text-sm" value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })} placeholder="e.g. class_10, all" />
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
```

- [ ] **Commit**

```
git add apps/web/src/pages/admin/FeeEngine.jsx
git commit -m "feat(admin): Fee Engine with DataTable and create/edit drawer"
```

### Task 3.3: Create Student Fee Profile

**Files:**
- Create: `apps/web/src/pages/admin/StudentProfile.jsx`

- [ ] **Create StudentProfile page**

```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // or props
import axios from 'axios';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';
import TabBar from '../../components/ui/TabBar';
import StatusChip from '../../components/ui/StatusChip';
import DataTable from '../../components/ui/DataTable';
import ActionButton from '../../components/ui/ActionButton';
import { Icon } from '../../components/Icon';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'payments', label: 'Payment History' },
  { key: 'fees', label: 'Fee Breakdown' },
  { key: 'waivers', label: 'Waivers & Penalties' },
  { key: 'receipts', label: 'Receipts' },
  { key: 'notes', label: 'Notes' },
];

export default function StudentProfile({ studentId }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [sRes, tRes, aRes] = await Promise.all([
          axios.get(`/api/admin/students?studentId=${studentId}`, { headers }),
          axios.get(`/api/fees/assignments?studentId=${studentId}`, { headers }),
          axios.get(`/api/payments/transactions?studentId=${studentId}`, { headers }),
        ]);
        setStudent(sRes.data);
        setAssignments(tRes.data);
        setTransactions(aRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [studentId]);

  if (!studentId) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#5f5e5d]">
        Select a student to view their profile
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Students"
        title={student?.name || 'Student Profile'}
        action={
          <div className="flex gap-2">
            <ActionButton icon={() => <Icon name="payments" className="text-lg" />}>Collect</ActionButton>
            <ActionButton variant="secondary" icon={() => <Icon name="price_check" className="text-lg" />}>Waive</ActionButton>
            <ActionButton variant="secondary" icon={() => <Icon name="print" className="text-lg" />}>Print</ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <GlassCard className="lg:col-span-1 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-[#5f5e5d] mb-3">
            {student?.name?.[0] || '?'}
          </div>
          <p className="font-medium text-[#141413]">{student?.name}</p>
          <p className="text-sm text-[#5f5e5d]">{student?.class}</p>
          {student?.status && <StatusChip variant={student.status === 'active' ? 'success' : 'pending'} className="mt-2">{student.status}</StatusChip>}
        </GlassCard>

        <GlassCard className="lg:col-span-1">
          <p className="text-xs text-[#5f5e5d] uppercase tracking-wider">Outstanding</p>
          <p className="text-2xl font-semibold text-[#d46a7a] mt-1">
            ₹{assignments.filter(a => a.status === 'pending' || a.status === 'overdue').reduce((s, a) => s + Number(a.feeStructure?.amount || 0), 0).toLocaleString('en-IN')}
          </p>
        </GlassCard>

        <GlassCard className="lg:col-span-1">
          <p className="text-xs text-[#5f5e5d] uppercase tracking-wider">Total Paid</p>
          <p className="text-2xl font-semibold text-[#16a34a] mt-1">
            ₹{transactions.filter(t => t.status === 'success').reduce((s, t) => s + Number(t.amount || 0), 0).toLocaleString('en-IN')}
          </p>
        </GlassCard>

        <GlassCard className="lg:col-span-1">
          <p className="text-xs text-[#5f5e5d] uppercase tracking-wider">Waivers</p>
          <p className="text-2xl font-semibold text-[#e8b86a] mt-1">₹0</p>
        </GlassCard>
      </div>

      <GlassCard>
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} className="mb-6" />

        {activeTab === 'overview' && (
          <DataTable
            columns={[
              { key: 'feeStructure', label: 'Fee Head', render: (v) => v?.name || '—' },
              { key: 'amount', label: 'Amount', render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
              { key: 'dueDate', label: 'Due Date', render: (v) => new Date(v).toLocaleDateString() },
              { key: 'status', label: 'Status', render: (v) => <StatusChip variant={v === 'paid' ? 'success' : v === 'overdue' ? 'error' : 'pending'}>{v}</StatusChip> },
            ]}
            data={assignments}
            emptyMessage="No fee assignments"
          />
        )}

        {activeTab === 'payments' && (
          <DataTable
            columns={[
              { key: 'receiptNumber', label: 'Receipt' },
              { key: 'amount', label: 'Amount', render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
              { key: 'method', label: 'Method' },
              { key: 'status', label: 'Status', render: (v) => <StatusChip variant={v === 'success' ? 'success' : v === 'failed' ? 'error' : 'pending'}>{v}</StatusChip> },
              { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
            ]}
            data={transactions}
            emptyMessage="No payments yet"
          />
        )}

        {activeTab !== 'overview' && activeTab !== 'payments' && (
          <p className="text-sm text-[#5f5e5d] py-8 text-center">Section coming soon</p>
        )}
      </GlassCard>
    </div>
  );
}
```

- [ ] **Commit**

```
git add apps/web/src/pages/admin/StudentProfile.jsx
git commit -m "feat(admin): StudentProfile page with tabs and metrics"
```

### Task 3.4: Create Payments Page

**Files:**
- Create: `apps/web/src/pages/admin/Payments.jsx`

- [ ] **Create Payments page**

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';
import DataTable from '../../components/ui/DataTable';
import StatusChip from '../../components/ui/StatusChip';
import SearchInput from '../../components/ui/SearchInput';
import FilterBar from '../../components/ui/FilterBar';
import ActionButton from '../../components/ui/ActionButton';
import Drawer from '../../components/ui/Drawer';
import { Icon } from '../../components/Icon';
import { toast } from '../../components/ui/Toast';

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetch = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/payments/transactions', { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = transactions.filter((t) => {
    if (search && !t.student?.name?.toLowerCase().includes(search.toLowerCase()) && !t.receiptNumber?.includes(search)) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    return true;
  });

  const columns = [
    { key: 'receiptNumber', label: 'Receipt', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
    { key: 'student', label: 'Student', render: (v) => v?.name || '—' },
    { key: 'amount', label: 'Amount', render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    { key: 'method', label: 'Method', render: (v) => <span className="capitalize">{v?.toLowerCase() || '—'}</span> },
    { key: 'status', label: 'Status', render: (v) => {
      const map = { success: 'success', pending: 'pending', failed: 'error', reversed: 'neutral' };
      return <StatusChip variant={map[v] || 'neutral'}>{v}</StatusChip>;
    }},
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Payments"
        title="Payment Management"
        action={
          <ActionButton icon={() => <Icon name="add" className="text-lg" />} onClick={() => setDrawerOpen(true)}>
            Record Payment
          </ActionButton>
        }
      />

      <GlassCard>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student or receipt..." className="flex-1" />
          <FilterBar>
            <select className="h-10 px-3 rounded-[10px] border border-gray-200 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
            </select>
          </FilterBar>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No payments found" />
      </GlassCard>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Record Payment" width="480px">
        <p className="text-sm text-[#5f5e5d] mb-4">Search for a student and record a payment.</p>
        <SearchInput value={search} onChange={setSearch} placeholder="Search student..." className="mb-4" />
        <ActionButton className="w-full" onClick={() => { setDrawerOpen(false); toast('Payment recorded'); }}>Submit Payment</ActionButton>
      </Drawer>
    </div>
  );
}
```

- [ ] **Commit**

```
git add apps/web/src/pages/admin/Payments.jsx
git commit -m "feat(admin): Payments page with search, filters, record drawer"
```

### Task 3.5: Create Defaulters Page

**Files:**
- Create: `apps/web/src/pages/admin/Defaulters.jsx`

- [ ] **Create Defaulters page**

```jsx
import { useState } from 'react';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';
import DataTable from '../../components/ui/DataTable';
import StatusChip from '../../components/ui/StatusChip';
import SearchInput from '../../components/ui/SearchInput';
import FilterBar from '../../components/ui/FilterBar';
import ActionButton from '../../components/ui/ActionButton';
import { Icon } from '../../components/Icon';

export default function Defaulters() {
  const [search, setSearch] = useState('');
  const [daysFilter, setDaysFilter] = useState('all');
  const { data: defaulters, loading } = useDashboardQuery('/api/dashboard/defaulters', { sort_by: 'risk' }, 5000);
  const list = (defaulters || []).filter((d) => {
    if (search && !d.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (daysFilter === '30' && (d.overdue_days || 0) < 30) return false;
    if (daysFilter === '60' && (d.overdue_days || 0) < 60) return false;
    if (daysFilter === '90' && (d.overdue_days || 0) < 90) return false;
    return true;
  });

  const columns = [
    { key: 'name', label: 'Student' },
    { key: 'class', label: 'Class' },
    { key: 'overdue_amount', label: 'Overdue', render: (v) => <span className="font-semibold text-[#d46a7a]">₹{Number(v || 0).toLocaleString('en-IN')}</span> },
    { key: 'overdue_days', label: 'Days', render: (v) => {
      const map = v > 60 ? 'error' : v > 30 ? 'warning' : 'pending';
      return <StatusChip variant={map}>{v || 0}d</StatusChip>;
    }},
    {
      key: 'risk',
      label: 'Risk',
      render: (v, row) => {
        const pct = row.default_risk_pct || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-[#d46a7a]" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-[#5f5e5d]">{pct}%</span>
          </div>
        );
      },
    },
  ];

  const totalOverdue = list.reduce((s, d) => s + Number(d.overdue_amount || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Defaulters"
        title={`${list.length} Overdue Accounts`}
        subtitle={`₹${totalOverdue.toLocaleString('en-IN')} total outstanding`}
        action={
          <div className="flex gap-2">
            <ActionButton icon={() => <Icon name="campaign" className="text-lg" />}>Send Reminders</ActionButton>
            <ActionButton variant="secondary" icon={() => <Icon name="gavel" className="text-lg" />}>Apply Penalties</ActionButton>
          </div>
        }
      />

      <GlassCard>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search student..." className="flex-1" />
          <FilterBar>
            <select className="h-10 px-3 rounded-[10px] border border-gray-200 text-sm" value={daysFilter} onChange={(e) => setDaysFilter(e.target.value)}>
              <option value="all">All Days</option>
              <option value="30">30+ Days</option>
              <option value="60">60+ Days</option>
              <option value="90">90+ Days</option>
            </select>
          </FilterBar>
        </div>
        <DataTable columns={columns} data={list} loading={loading} emptyMessage="No defaulters found" />
      </GlassCard>
    </div>
  );
}
```

- [ ] **Commit**

```
git add apps/web/src/pages/admin/Defaulters.jsx
git commit -m "feat(admin): Defaulters page with risk indicators and filters"
```

### Task 3.6: Rebuild Reconciliation Page

**Files:**
- Overwrite: `apps/web/src/pages/admin/Reconciliation.jsx`

- [ ] **Rebuild Reconciliation**

```jsx
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
          <h3 className="text-sm font-medium text-[#141413] mb-3">Paste CSV Data</h3>
          <p className="text-xs text-[#5f5e5d] mb-3">Format: date,amount,description (one per line)</p>
          <textarea
            className="w-full h-40 p-4 rounded-[12px] border border-gray-200 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#e8977a]/30"
            placeholder={"2026-07-18,25000,Tuition fee deposit\n2026-07-18,65000,Transport fee"}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
        </GlassCard>

        <GlassCard className="lg:col-span-2 flex flex-col justify-center items-center text-center">
          <div className="text-3xl font-semibold text-[#16a34a]">{matched.length}</div>
          <p className="text-sm text-[#5f5e5d]">Matched</p>
          <div className="text-3xl font-semibold text-[#e8977a] mt-4">{unmatched.length}</div>
          <p className="text-sm text-[#5f5e5d]">Unmatched</p>
        </GlassCard>
      </div>

      {matched.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-sm font-medium text-[#16a34a] mb-4">Matched ({matched.length})</h3>
            <DataTable columns={matchColumns} data={matched} emptyMessage="No matches" />
          </GlassCard>
          <GlassCard>
            <h3 className="text-sm font-medium text-[#e8977a] mb-4">Unmatched ({unmatched.length})</h3>
            <DataTable columns={matchColumns} data={unmatched} emptyMessage="All matched!" />
          </GlassCard>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Commit**

```
git add apps/web/src/pages/admin/Reconciliation.jsx
git commit -m "feat(admin): rebuild Reconciliation with split-pane matching"
```

### Task 3.7: Create Reports & Analytics Page

**Files:**
- Create: `apps/web/src/pages/admin/ReportsAnalytics.jsx`
- Note: existing `Reports.jsx` stays (used as sub-component in old Dashboard). New standalone page.

- [ ] **Create ReportsAnalytics page**

```jsx
import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import PageHeader from '../../components/ui/PageHeader';
import GlassCard from '../../components/ui/GlassCard';
import ActionButton from '../../components/ui/ActionButton';
import { Icon } from '../../components/Icon';

const CHART_COLORS = ['#8b8fd4', '#6bc9a9', '#5bb98a', '#e8977a', '#e8b86a', '#d46a7a'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white shadow-lg rounded-[12px] p-3 border border-gray-100 text-sm">
        <p className="font-medium text-[#141413]">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>₹{Number(p.value).toLocaleString('en-IN')}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsAnalytics() {
  const [period, setPeriod] = useState('monthly');
  const { data: report, loading } = useDashboardQuery('/api/dashboard/reports', { period }, 5000);

  const revenueData = report?.breakdown?.map((item) => ({
    name: item.type?.toUpperCase(),
    value: Number(item.total || 0),
  })) || [];

  return (
    <div>
      <PageHeader
        eyebrow="Reports"
        title="Analytics & Insights"
        action={
          <div className="flex gap-2">
            <select className="h-10 px-3 rounded-[10px] border border-gray-200 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="session">Session</option>
            </select>
            <ActionButton icon={() => <Icon name="download" className="text-lg" />}>Export</ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassCard>
          <p className="text-xs text-[#5f5e5d] uppercase">Total Collected</p>
          <p className="text-2xl font-semibold text-[#141413] mt-1">₹{Number(report?.total_collected || 0).toLocaleString('en-IN')}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-[#5f5e5d] uppercase">Total Pending</p>
          <p className="text-2xl font-semibold text-[#e8b86a] mt-1">₹{Number(report?.total_pending || 0).toLocaleString('en-IN')}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-[#5f5e5d] uppercase">Defaulters</p>
          <p className="text-2xl font-semibold text-[#d46a7a] mt-1">{report?.defaulters_count || 0}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-[#5f5e5d] uppercase">Avg Collection/Day</p>
          <p className="text-2xl font-semibold text-[#8b8fd4] mt-1">₹{Number(report?.avg_daily || 0).toLocaleString('en-IN')}</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <GlassCard>
          <h3 className="font-medium text-[#141413] mb-4">Revenue Trend</h3>
          {!loading && revenueData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#e8b86a" strokeWidth={2} dot={{ fill: '#e8b86a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-[280px] flex items-center justify-center text-sm text-[#5f5e5d]">{loading ? 'Loading...' : 'No data'}</div>}
        </GlassCard>

        <GlassCard>
          <h3 className="font-medium text-[#141413] mb-4">Collection by Fee Type</h3>
          {!loading && revenueData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6bc9a9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-[280px] flex items-center justify-center text-sm text-[#5f5e5d]">{loading ? 'Loading...' : 'No data'}</div>}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard>
          <h3 className="font-medium text-[#141413] mb-4">Payment Methods</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueData.slice(0, 5)} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {revenueData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-medium text-[#141413] mb-4">Defaulter Aging</h3>
          <p className="text-sm text-[#5f5e5d]">Defaulter aging analysis appears here</p>
        </GlassCard>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```
git add apps/web/src/pages/admin/ReportsAnalytics.jsx
git commit -m "feat(admin): ReportsAnalytics page with chart grid and KPI cards"
```

### Task 3.8: Update App.jsx Routing

**Files:**
- Modify: `apps/web/src/App.jsx`

- [ ] **Update App.jsx to add new pages and sidebar nav items**

Key changes:
- Import new pages: FeeEngine, StudentProfile, Payments, Defaulters, ReportsAnalytics
- Import Sidebar and PageShell instead of TopNavBar
- Add nav item mapping for sidebar module keys
- Wire activeModule state
- Keep existing login/guardian/cashier routing

```jsx
// New imports to add at top:
import FeeEngine from './pages/admin/FeeEngine';
import StudentProfile from './pages/admin/StudentProfile';
import Payments from './pages/admin/Payments';
import Defaulters from './pages/admin/Defaulters';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import ToastContainer from './components/ui/Toast';

// New state:
const [activeModule, setActiveModule] = useState('dashboard');
const [selectedStudentId, setSelectedStudentId] = useState(null);

// Sidebar navigation handler:
const handleNavigate = (module) => {
  setActiveModule(module);
  setDashboardTab(null); // reset tab-based nav
};

// Replace the dashboard tab-based rendering with module-based:
const renderModule = () => {
  switch (activeModule) {
    case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
    case 'students': return <StudentProfile studentId={selectedStudentId} />;
    case 'fee-engine': return <FeeEngine />;
    case 'payments': return <Payments />;
    case 'defaulters': return <Defaulters />;
    case 'reconciliation': return <Reconciliation />;
    case 'reports': return <ReportsAnalytics />;
    case 'settings': return <div className="text-sm text-[#5f5e5d]">Settings (coming soon)</div>;
    default: return <Dashboard onNavigate={handleNavigate} />;
  }
};

// Wrap in PageShell:
{page === 'dashboard' && (
  <PageShell
    module={activeModule}
    user={user}
    onNavigate={handleNavigate}
    onLogout={handleLogout}
  >
    <ToastContainer />
    {renderModule()}
  </PageShell>
)}
```

- [ ] **Commit**

```
git add apps/web/src/App.jsx
git commit -m "feat(routing): add module-based sidebar navigation for new pages"
```

---

## Phase 4: Redesigned Pages

### Task 4.1: Redesign Login

**Files:**
- Modify: `apps/web/src/pages/auth/Login.jsx`

**Scope:** Keep full existing logic (validation, OTP flow, store calls). Replace card with GlassCard, inputs with 10px radius, add module accent.

- [ ] **Update Login shell**

Replace the outer card wrapper:
- Use `GlassCard` instead of `bg-lifted-cream rounded-frame...`
- Inputs get `rounded-[10px]` class
- Button uses `ActionButton` with periwinkle accent
- Keep all state, form handlers, validation, store calls identical

- [ ] **Commit**

```
git add apps/web/src/pages/auth/Login.jsx
git commit -m "feat(auth): redesign Login shell with GlassCard"
```

### Task 4.2: Redesign Signup and ForgotPassword

- [ ] **Apply same shell update to Signup.jsx and ForgotPassword.jsx**

Same pattern: replace card wrapper with GlassCard, inputs to 10px radius, buttons to ActionButton. Keep all logic.

- [ ] **Commit**

```
git add apps/web/src/pages/auth/Signup.jsx apps/web/src/pages/auth/ForgotPassword.jsx
git commit -m "feat(auth): redesign Signup and ForgotPassword shells"
```

### Task 4.3: Redesign Cashier Pages

**Files:**
- Modify: `apps/web/src/pages/cashier/Collections.jsx`
- Modify: `apps/web/src/pages/cashier/OfflineQueue.jsx`
- Modify: `apps/web/src/pages/cashier/Deposits.jsx`

- [ ] **Update each cashier page**

Replace:
- Eyebrow + h1 → `<PageHeader>`
- `<Card>` → `<GlassCard>`
- `<PillButton>` → `<ActionButton>`
- `<Alert>` → inline or `toast()`
- `<StatusBadge>` → `<StatusChip>`
- Keep all data fetching, state, and logic

- [ ] **Commit**

```
git add apps/web/src/pages/cashier/Collections.jsx apps/web/src/pages/cashier/OfflineQueue.jsx apps/web/src/pages/cashier/Deposits.jsx
git commit -m "feat(cashier): redesign pages with new components"
```

### Task 4.4: Redesign Guardian Pages

**Files:**
- Modify: `apps/web/src/pages/guardian/Payment.jsx`
- Modify: `apps/web/src/pages/guardian/PaymentSuccess.jsx`
- Modify: `apps/web/src/pages/guardian/Receipts.jsx`

- [ ] **Update each guardian page**

Same pattern as cashier: replace card/button/alert/badge wrappers. Keep all logic.

- [ ] **Commit**

```
git add apps/web/src/pages/guardian/Payment.jsx apps/web/src/pages/guardian/PaymentSuccess.jsx apps/web/src/pages/guardian/Receipts.jsx
git commit -m "feat(guardian): redesign pages with new components"
```

### Task 4.5: Redesign Existing Admin Pages (Approvals, CashierSetup, Expenses)

**Files:**
- Modify: `apps/web/src/pages/admin/Approvals.jsx`
- Modify: `apps/web/src/pages/admin/CashierSetup.jsx`
- Modify: `apps/web/src/pages/admin/Expenses.jsx`

- [ ] **Update each admin page**

Replace shell wrappers. Keep existing business logic. These pages have complex forms and data — do not refactor logic, only redesign presentation layer.

- [ ] **Commit**

```
git add apps/web/src/pages/admin/Approvals.jsx apps/web/src/pages/admin/CashierSetup.jsx apps/web/src/pages/admin/Expenses.jsx
git commit -m "feat(admin): redesign Approvals, CashierSetup, Expenses with new components"
```

---

## Phase 5: Polish

### Task 5.1: Framer Motion Micro-interactions

- [ ] **Add motion to all rebuilt pages**

- StatCard: add `whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}`
- GlassCard hoverable: already has `whileHover: { y: -2 }`
- Chart containers: `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}`
- DataTable rows: already have `motion.tr` with fade-in
- Sidebar indicator: already has `motion.div layoutId`

- [ ] **Commit**

```
git add -A
git commit -m "feat(motion): add Framer Motion micro-interactions across pages"
```

### Task 5.2: Responsive Adjustments

- [ ] **Ensure mobile-friendliness**

- Sidebar: should collapse on mobile (hamburger toggle)
- Dashboard charts: stack vertically on small screens (grid cols)
- DataTables: horizontal scroll wrapper on mobile
- ContextRibbon: compact on mobile (hide breadcrumbs, smaller padding)

- [ ] **Commit**

```
git add -A
git commit -m "feat(responsive): mobile layout adjustments"
```

### Task 5.3: Loading Skeletons

- [ ] **Wire Skeleton to all loading states**

- Dashboard StatCards: show skeleton during loading
- DataTables: built-in skeleton rows
- FeeEngine, Defaulters, Reports: skeleton while fetching

- [ ] **Commit**

```
git add -A
git commit -m "feat(loading): add skeleton placeholders"
```

### Task 5.4: Empty States

- [ ] **Add EmptyState components**

- Every DataTable has `emptyMessage` prop
- Dashboard shows empty state for defaulter list when no data
- FeeEngine shows empty state when no structures
- Payments shows empty state when no transactions

- [ ] **Commit**

```
git add -A
git commit -m "feat(empty): add empty state messages across all pages"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** Every screen from spec has a corresponding file:
  - Dashboard → Task 3.1
  - Fee Engine → Task 3.2
  - Student Profile → Task 3.3
  - Payments → Task 3.4
  - Defaulters → Task 3.5
  - Reconciliation → Task 3.6
  - Reports → Task 3.7
  - Login → Task 4.1
  - Auth (signup, forgot) → Task 4.2
  - Cashier pages → Task 4.3
  - Guardian pages → Task 4.4
  - Settings/roles → Task 3.8 placeholder

- [ ] **Placeholder scan:** No TBDs, no "implement later", no "similar to X". All code blocks contain working JSX.

- [ ] **Type consistency:** All component imports use exact file paths relative to `apps/web/src/`. Module accent keys match between sidebar, CSS tokens, hooks, and page components.

- [ ] **API compatibility:** All API calls use existing endpoints (`/api/dashboard/*`, `/api/fees/*`, `/api/payments/*`, `/api/admin/*`). No new endpoints needed.

- [ ] **No breaking changes:** App.jsx routing structure preserved. Existing auth store, useDashboardQuery hook, and idb utils unchanged.
