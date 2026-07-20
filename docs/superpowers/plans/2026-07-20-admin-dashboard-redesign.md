# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the admin dashboard with glassmorphism styling, pastel gradients, new sidebar navigation, and priority-driven content layout.

**Architecture:** Add pastel theme tokens to Tailwind, create standalone glass-component primitives, build a glass sidebar for admin sub-navigation, then rewrite the Dashboard page to compose new components in a defaulter-first information hierarchy.

**Tech Stack:** React 19 + Vite 8 + Tailwind CSS v4 + Framer Motion 12 + Recharts 3 + Material Symbols

## Global Constraints

- Keep all existing non-admin pages untouched (auth, guardian, cashier)
- Use existing Hanken Grotesk font and Material Symbols icon system
- No new npm dependencies
- All glass effects use Tailwind's `backdrop-blur` utilities + semi-transparent backgrounds (no `@apply` or custom CSS for glass, use inline classes)
- Pastel color tokens added only to `index.css` under `@theme` — not as standalone CSS variables
- Framer Motion animations kept lightweight (spring for cards, simple opacity/scale for interactions)
- All dashboard components go in `apps/web/src/components/dashboard/`
- Remove old components (BalanceCard, RevenueChart, DefaulterList, QuickActions) only after Dashboard.jsx is rewritten

---

### Task 1: Pastel Theme Tokens + GlassCard Component

**Files:**
- Modify: `apps/web/src/index.css` (add pastel tokens + glass utility)
- Create: `apps/web/src/components/dashboard/GlassCard.jsx`

**Interfaces:**
- Consumes: Nothing
- Produces: `GlassCard` — `<GlassCard accent="lavender|peach|mint|rose|sky" className="">{children}</GlassCard>`

- [ ] **Step 1: Add pastel color tokens to index.css**

Insert after the existing `--shadow-deep` line in the `@theme` block:

```css
/* Pastel accents — dashboard glassmorphism */
--color-pastel-lavender: #e8e0f0;
--color-pastel-peach: #fde8d0;
--color-pastel-mint: #d0f0e0;
--color-pastel-rose: #f0d8e0;
--color-pastel-sky: #d0e8f8;
--color-pastel-purple: #c8b8e8;
--color-pastel-coral: #f8c8b8;
--color-pastel-teal: #b8e8d8;
--color-pastel-pink: #e8b8c8;
--color-pastel-periwinkle: #b8c8e8;
```

Note: order doesn't matter inside `@theme` — Tailwind v4 processes all tokens.

- [ ] **Step 2: Create GlassCard component**

```jsx
import React from 'react';

const ACCENT_MAP = {
  lavender: { bg: 'bg-pastel-lavender/20', border: 'border-pastel-purple/30', glow: 'shadow-pastel-purple/10' },
  peach:    { bg: 'bg-pastel-peach/20',    border: 'border-pastel-coral/30',  glow: 'shadow-pastel-coral/10' },
  mint:     { bg: 'bg-pastel-mint/20',     border: 'border-pastel-teal/30',   glow: 'shadow-pastel-teal/10' },
  rose:     { bg: 'bg-pastel-rose/20',     border: 'border-pastel-pink/30',   glow: 'shadow-pastel-pink/10' },
  sky:      { bg: 'bg-pastel-sky/20',      border: 'border-pastel-periwinkle/30', glow: 'shadow-pastel-periwinkle/10' },
};

export default function GlassCard({ accent = 'lavender', children, className = '' }) {
  const a = ACCENT_MAP[accent] || ACCENT_MAP.lavender;
  return (
    <div
      className={`rounded-[20px] backdrop-blur-xl bg-white/60 border ${a.border} ${a.glow} shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Verify GlassCard loads without errors**

Run: `node -e "try { require('./apps/web/src/components/dashboard/GlassCard.jsx') } catch(e) { console.log(e.message) }"` from root. Expected output: a module-not-found error about React (expected for server-side, confirms no syntax errors). If Vite is running, check browser console for loading errors.

---

### Task 2: MetricCard Component

**Files:**
- Create: `apps/web/src/components/dashboard/MetricCard.jsx`

**Interfaces:**
- Consumes: `GlassCard` (accent prop)
- Produces: `<MetricCard title="Bank Balance" value={123456} icon="account_balance" accent="lavender" />`

- [ ] **Step 1: Create MetricCard**

```jsx
import React, { useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { Icon } from '../Icon';
import GlassCard from './GlassCard';

function formatINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export default function MetricCard({ title, value, icon, accent = 'lavender' }) {
  const valRef = useRef(null);

  React.useEffect(() => {
    if (valRef.current) {
      const node = valRef.current;
      const controls = animate(0, Number(value) || 0, {
        duration: 1.2,
        ease: 'easeOut',
        onUpdate(latest) {
          node.textContent = formatINR(latest);
        },
      });
      return () => controls.stop();
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <GlassCard accent={accent} className="p-6 md:p-8 relative overflow-hidden group hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] hover:scale-[1.02] transition-all duration-300">
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Icon name={icon} className="text-[24px] text-ink-black" />
          </div>
        </div>
        <div>
          <p ref={valRef} className="font-headline-lg-mobile text-[40px] md:font-headline-lg md:text-[56px] text-ink-black tracking-tight leading-none">
            {formatINR(value)}
          </p>
          <p className="font-eyebrow text-eyebrow text-on-surface-variant uppercase tracking-wider mt-2">
            {title}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
```

---

### Task 3: AdminSidebar + Navigation Restructure

**Files:**
- Create: `apps/web/src/components/layout/AdminSidebar.jsx`
- Modify: `apps/web/src/components/layout/TopNavBar.jsx` (remove admin tabs)
- Modify: `apps/web/src/App.jsx` (wrap admin content with sidebar)

**Interfaces:**
- Consumes: `activeTab` (string), `onNavigate` (fn) — same pattern as current TopNavBar
- Produces: `<AdminSidebar activeTab={tab} onNavigate={setTab} />` sidebar + modified TopNavBar

- [ ] **Step 1: Create AdminSidebar**

```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../Icon';

const ADMIN_LINKS = [
  { label: 'Analytics',            icon: 'analytics' },
  { label: 'Fee Engine',           icon: 'receipt_long' },
  { label: 'Pending Approvals',    icon: 'approval' },
  { label: 'Cashier Setup',        icon: 'badge' },
  { label: 'Bank Reconciliation',  icon: 'account_balance' },
  { label: 'Maintenance Expenses', icon: 'handyman' },
];

export default function AdminSidebar({ activeTab, onNavigate }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 w-[220px] pt-24 pb-6 px-3">
        <nav className="flex flex-col gap-1.5 bg-white/50 backdrop-blur-xl rounded-[20px] border border-white/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] p-3 flex-1 overflow-y-auto">
          {ADMIN_LINKS.map((link) => {
            const isActive = activeTab === link.label;
            return (
              <motion.button
                key={link.label}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate(link.label)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-nav-button text-[14px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange ${
                  isActive
                    ? 'bg-gradient-to-r from-pastel-lavender/60 to-pastel-sky/60 text-ink-black shadow-sm border border-white/60'
                    : 'text-on-surface-variant hover:bg-white/40 hover:text-ink-black'
                }`}
              >
                <Icon name={link.icon} className="text-[20px]" />
                {link.label}
              </motion.button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile — horizontal scrollable pill bar */}
      <div className="lg:hidden overflow-x-auto px-margin-mobile pb-2 -mx-margin-mobile px-margin-mobile sticky top-[72px] z-30 bg-canvas-cream/90 backdrop-blur-md">
        <div className="flex gap-2 py-2">
          {ADMIN_LINKS.map((link) => {
            const isActive = activeTab === link.label;
            return (
              <button
                key={link.label}
                onClick={() => onNavigate(link.label)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-nav-button text-[13px] transition-all ${
                  isActive
                    ? 'bg-ink-black text-white shadow-sm'
                    : 'bg-white/60 text-on-surface-variant border border-white/60'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Remove admin tabs from TopNavBar**

Replace the `LINKS` object and the admin nav rendering in `TopNavBar.jsx`:

Old:
```jsx
const LINKS = {
  admin: ['Analytics', 'Cashier Setup', 'Fee Engine', 'Pending Approvals', 'Bank Reconciliation', 'Maintenance Expenses'],
  cashier: ['Collect Fees', 'Offline Queue', 'Cheque Deposits'],
  guardian: ['My Wards', 'Pay Fees', 'Receipt History'],
};
```

New:
```jsx
const LINKS = {
  admin: [],
  cashier: ['Collect Fees', 'Offline Queue', 'Cheque Deposits'],
  guardian: ['My Wards', 'Pay Fees', 'Receipt History'],
};
```

Also wrap the nav links section in a conditional so it doesn't render empty for admin:
```jsx
{links.length > 0 && (
  <>
    <div className="h-6 w-px bg-dust-taupe/30" />
    <div className="flex items-center gap-6 whitespace-nowrap">
      {links.map((label) => (
        <NavLink key={label} label={label} active={activeTab === label} onClick={() => onNavigate(label)} />
      ))}
    </div>
  </>
)}
```

- [ ] **Step 3: Update App.jsx — add AdminSidebar to admin layout**

In `App.jsx`, inside the `renderPage` function's `case 'dashboard':` where `user.role === 'admin'`, add the sidebar:

Old:
```jsx
return (
  <>
    <TopNavBar role={user.role} activeTab={dashboardTab} onNavigate={setDashboardTab} user={user} onLogout={handleLogout} />
    <PageShell>{renderDashboard()}</PageShell>
    <Footer />
  </>
);
```

New:
```jsx
return (
  <>
    <TopNavBar role={user.role} activeTab={dashboardTab} onNavigate={setDashboardTab} user={user} onLogout={handleLogout} />
    {user.role === 'admin' ? (
      <div className="flex">
        <AdminSidebar activeTab={dashboardTab} onNavigate={setDashboardTab} />
        <main className="flex-1 lg:ml-[220px]">
          <PageShell>{renderDashboard()}</PageShell>
        </main>
      </div>
    ) : (
      <PageShell>{renderDashboard()}</PageShell>
    )}
    <Footer />
  </>
);
```

Also add the import at the top:
```jsx
import AdminSidebar from './components/layout/AdminSidebar';
```

---

### Task 4: DefaulterPanel Component

**Files:**
- Create: `apps/web/src/components/dashboard/DefaulterPanel.jsx`

**Interfaces:**
- Consumes: `useDashboardQuery` hook (exists)
- Produces: `<DefaulterPanel />` — ranked list in glass card

- [ ] **Step 1: Create DefaulterPanel**

```jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import { Icon } from '../Icon';
import GlassCard from './GlassCard';

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function PriorityBadge({ days }) {
  if (days > 60) return <span className="px-2.5 py-0.5 rounded-full bg-pastel-rose/70 text-error text-[11px] font-nav-button font-semibold">HIGH</span>;
  if (days > 30) return <span className="px-2.5 py-0.5 rounded-full bg-pastel-peach/70 text-warning text-[11px] font-nav-button font-semibold">MEDIUM</span>;
  return <span className="px-2.5 py-0.5 rounded-full bg-pastel-mint/70 text-success text-[11px] font-nav-button font-semibold">LOW</span>;
}

export default function DefaulterPanel() {
  const [sortBy, setSortBy] = useState('risk');
  const [filterClass, setFilterClass] = useState('');

  const { data: _defaulters, loading } = useDashboardQuery('/api/dashboard/defaulters', { sort_by: sortBy, filter_class: filterClass }, 5000);
  const defaulters = _defaulters ?? [];

  return (
    <GlassCard accent="rose" className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-ink-black tracking-tight">Defaulter Tracking</h2>
          <p className="font-body text-body text-on-surface-variant text-[14px] mt-0.5">Prioritized accounts requiring follow-up</p>
        </div>
        <div className="flex gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/70 border border-white/60 rounded-full px-3 py-1.5 font-nav-button text-[12px] text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-ink-black backdrop-blur-sm">
            <option value="risk">Risk</option>
            <option value="days">Days</option>
            <option value="amount">Amount</option>
          </select>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
            className="bg-white/70 border border-white/60 rounded-full px-3 py-1.5 font-nav-button text-[12px] text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-ink-black backdrop-blur-sm">
            <option value="">All Classes</option>
            <option value="Grade 1-A">1-A</option>
            <option value="Grade 2-C">2-C</option>
            <option value="Grade 5-A">5-A</option>
            <option value="Grade 10-A">10-A</option>
            <option value="Grade 10-B">10-B</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant text-[14px]">Loading defaulters…</div>
      ) : defaulters.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant text-[14px]">No overdue accounts.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {defaulters.slice(0, 5).map((d, idx) => (
            <motion.div
              key={d.id || idx}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/40 hover:bg-white/70 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center shadow-sm shrink-0">
                <span className="font-nav-button text-[13px] text-ink-black font-semibold">{getInitials(d.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-nav-button text-[14px] text-ink-black truncate">{d.name}</span>
                  <PriorityBadge days={d.overdue_days} />
                </div>
                <p className="text-[12px] text-on-surface-variant truncate">{d.class} · {d.guardian_name || 'Unknown'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-nav-button text-[14px] text-ink-black">₹{Number(d.overdue_amount).toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-error">{d.overdue_days}d overdue</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-ink-black hover:text-white text-on-surface-variant">
                <Icon name="chat" className="text-[16px]" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
```

---

### Task 5: RevenueBreakdown Component

**Files:**
- Create: `apps/web/src/components/dashboard/RevenueBreakdown.jsx`

**Interfaces:**
- Consumes: Nothing (uses static breakdown data for now)
- Produces: `<RevenueBreakdown />` — donut + category list in glass card

- [ ] **Step 1: Create RevenueBreakdown**

```jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import GlassCard from './GlassCard';

const DATA = [
  { label: 'Tuition Fees', pct: 65, icon: 'school', color: '#c8b8e8' },
  { label: 'Transport', pct: 20, icon: 'directions_bus', color: '#f8c8b8' },
  { label: 'Cafeteria & Extras', pct: 15, icon: 'restaurant', color: '#b8e8d8' },
];

const COLORS = ['#c8b8e8', '#f8c8b8', '#b8e8d8'];

export default function RevenueBreakdown() {
  return (
    <GlassCard accent="sky" className="p-6 md:p-8">
      <h3 className="font-headline-sm text-headline-sm text-ink-black tracking-tight mb-6">Revenue Breakdown</h3>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="w-[160px] h-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="pct">
                {DATA.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 w-full space-y-4">
          {DATA.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="flex-1 font-body text-[14px] text-ink-black">{item.label}</span>
              <span className="font-nav-button text-[14px] text-ink-black">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
```

---

### Task 6: MonthlyChart Component

**Files:**
- Create: `apps/web/src/components/dashboard/MonthlyChart.jsx`

**Interfaces:**
- Consumes: `useDashboardQuery` hook
- Produces: `<MonthlyChart />` — bar chart with period filters in glass card

- [ ] **Step 1: Create MonthlyChart**

```jsx
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import GlassCard from './GlassCard';

const COLORS = ['#d0e8f8', '#b8c8e8', '#c8b8e8', '#e8b8c8'];

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg border border-white/60 text-[13px]">
        <p className="font-medium text-ink-black">{payload[0].name}</p>
        <p className="text-pastel-purple font-semibold">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
}

export default function MonthlyChart() {
  const [period, setPeriod] = useState('monthly');
  const { data: rawData, loading } = useDashboardQuery('/api/dashboard/revenue-breakdown', { period }, 5000);

  const chartData = useMemo(() => {
    if (!rawData?.labels) return [];
    return rawData.labels.map((label, idx) => ({
      name: label.toUpperCase(),
      value: Number(rawData.data[idx]) || 0,
    }));
  }, [rawData]);

  return (
    <GlassCard accent="sky" className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline-sm text-headline-sm text-ink-black tracking-tight">Collection Trends</h3>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}
          className="bg-white/70 border border-white/60 rounded-full px-3 py-1.5 font-nav-button text-[12px] text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-ink-black backdrop-blur-sm">
          <option value="daily">Today</option>
          <option value="weekly">7 Days</option>
          <option value="monthly">30 Days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[220px] text-on-surface-variant text-[14px]">Loading…</div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[220px] text-on-surface-variant text-[14px]">No data</div>
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#464742" fontSize={10} tickLine={false} />
              <YAxis stroke="#464742" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(200,184,232,0.15)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
```

---

### Task 7: QuickActionFab Component

**Files:**
- Create: `apps/web/src/components/dashboard/QuickActionFab.jsx`

**Interfaces:**
- Consumes: `onAction` callback (same signature as old QuickActions)
- Produces: `<QuickActionFab onAction={fn} />` — floating glass FAB group

- [ ] **Step 1: Create QuickActionFab**

```jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../Icon';

const ACTIONS = [
  { label: 'Waive Fee', icon: 'price_check' },
  { label: 'Send Reminder', icon: 'campaign' },
  { label: 'Add Expense', icon: 'add_circle' },
  { label: 'Export Report', icon: 'download' },
];

export default function QuickActionFab({ onAction }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && ACTIONS.map((action, idx) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 16, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.8 }}
            transition={{ delay: idx * 0.04 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { onAction(action.label); setOpen(false); }}
            className="flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white/60 rounded-full px-4 py-2.5 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.12)] hover:bg-white/90 transition-all text-ink-black font-nav-button text-[13px]"
          >
            <Icon name={action.icon} className="text-[18px]" />
            {action.label}
          </motion.button>
        ))}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] flex items-center justify-center text-ink-black hover:bg-white transition-all"
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Icon name="add" className="text-[28px]" />
        </motion.span>
      </motion.button>
    </div>
  );
}
```

---

### Task 8: Rewrite Dashboard.jsx + Cleanup Old Components

**Files:**
- Rewrite: `apps/web/src/pages/admin/Dashboard.jsx`
- Delete: `apps/web/src/components/dashboard/BalanceCard.jsx`
- Delete: `apps/web/src/components/dashboard/RevenueChart.jsx`
- Delete: `apps/web/src/components/dashboard/DefaulterList.jsx`
- Delete: `apps/web/src/components/dashboard/QuickActions.jsx`

**Interfaces:**
- Consumes: MetricCard, DefaulterPanel, RevenueBreakdown, MonthlyChart, QuickActionFab, GlassCard, existing waiver modal logic
- Produces: New dashboard page

- [ ] **Step 1: Rewrite Dashboard.jsx**

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MetricCard from '../../components/dashboard/MetricCard';
import DefaulterPanel from '../../components/dashboard/DefaulterPanel';
import RevenueBreakdown from '../../components/dashboard/RevenueBreakdown';
import MonthlyChart from '../../components/dashboard/MonthlyChart';
import QuickActionFab from '../../components/dashboard/QuickActionFab';
import Reports from './Reports';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import { Icon } from '../../components/Icon';
import { Alert, PillButton, InputField, SelectField } from '../../components/ui/Primitives';

export default function Dashboard({ setAdminTab }) {
  const { data: metrics, loading, refetch } = useDashboardQuery('/api/dashboard/metrics', {}, 5000);

  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [waiverAmount, setWaiverAmount] = useState('');
  const [waiverReason, setWaiverReason] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [submittingWaiver, setSubmittingWaiver] = useState(false);

  const loadStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } });
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to load students roster:', err);
    }
  };

  useEffect(() => {
    if (!selectedStudentId) {
      setAssignments([]);
      return;
    }
    const loadAssignments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/fees/assignments?studentId=${selectedStudentId}`, { headers: { Authorization: `Bearer ${token}` } });
        setAssignments(res.data.filter((a) => a.status === 'pending' || a.status === 'overdue'));
      } catch (err) {
        console.error('Failed to load student assignments:', err);
      }
    };
    loadAssignments();
  }, [selectedStudentId]);

  const handleActionClick = (action) => {
    if (action === 'Add Expense') {
      if (setAdminTab) setAdminTab('expenses');
    } else if (action === 'Send Reminder') {
      setToastMessage('SMS & Email overdue payment reminders dispatched to all defaulters!');
      setTimeout(() => setToastMessage(null), 4000);
    } else if (action === 'Waive Fee') {
      loadStudents();
      setFormError(null);
      setFormSuccess(null);
      setSelectedStudentId('');
      setSelectedAssignmentId('');
      setWaiverAmount('');
      setWaiverReason('');
      setShowWaiverModal(true);
    }
  };

  const handleWaiverSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedAssignmentId || !waiverAmount || !waiverReason) {
      setFormError('All fields are required to request a fee waiver.');
      return;
    }
    setSubmittingWaiver(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/waivers', {
        student_id: selectedStudentId, fee_assignment_id: selectedAssignmentId,
        amount: waiverAmount, type: 'waiver', reason: waiverReason,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setFormSuccess('Waiver request submitted successfully for Admin approval!');
      refetch();
      setTimeout(() => setShowWaiverModal(false), 2000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Waiver creation failed.');
    } finally {
      setSubmittingWaiver(false);
    }
  };

  const m = metrics || { bank_balance: 0, in_hand_cash: 0, pending_fees: 0, today_collections: 0 };

  return (
    <div className="flex flex-col gap-6 pb-24 relative">
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] bg-ink-black text-canvas-cream rounded-full px-6 py-3 shadow-lg font-nav-button text-[14px]">
          {toastMessage}
        </div>
      )}

      {showWaiverModal && (
        <div className="fixed inset-0 z-50 bg-ink-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[460px] bg-white/80 backdrop-blur-xl rounded-[20px] p-8 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] border border-white/60">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-sm text-headline-sm text-ink-black">Request Fee Waiver</h2>
              <button type="button" onClick={() => setShowWaiverModal(false)} aria-label="Close" className="text-on-surface-variant hover:text-ink-black rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange">
                <Icon name="close" className="text-[22px]" />
              </button>
            </div>
            <p className="font-body text-body text-on-surface-variant text-[14px] mb-6">Create a pending waiver request. It must be approved under Pending Approvals.</p>
            <Alert tone="error">{formError}</Alert>
            <Alert tone="success">{formSuccess}</Alert>
            <form onSubmit={handleWaiverSubmit} className="flex flex-col gap-5 mt-2">
              <SelectField label="Select Student" id="waiver-student" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                ))}
              </SelectField>
              <SelectField label="Select Fee Component" id="waiver-assign" value={selectedAssignmentId} onChange={(e) => setSelectedAssignmentId(e.target.value)} disabled={!selectedStudentId}>
                <option value="">-- Choose Assignment --</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>{a.feeStructure.name} (Due: {new Date(a.dueDate).toLocaleDateString()})</option>
                ))}
              </SelectField>
              {selectedStudentId && assignments.length === 0 && (
                <span className="text-error text-[13px]">No pending fee assignments found for this student.</span>
              )}
              <InputField label="Waiver Amount (₹)" id="waiver-amount" type="number" placeholder="e.g. 1000" value={waiverAmount} onChange={(e) => setWaiverAmount(e.target.value)} />
              <InputField label="Reason / Justification" id="waiver-reason" placeholder="e.g. Academic scholarship rebate" value={waiverReason} onChange={(e) => setWaiverReason(e.target.value)} />
              <div className="flex gap-3 mt-2">
                <PillButton type="submit" disabled={submittingWaiver || assignments.length === 0}>{submittingWaiver ? 'Submitting…' : 'Submit Request'}</PillButton>
                <PillButton type="button" variant="outline" onClick={() => setShowWaiverModal(false)} disabled={submittingWaiver}>Cancel</PillButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hero Metrics Row */}
      {loading && !metrics ? (
        <div className="text-center text-on-surface-variant py-12 text-[14px]">Loading dashboard metrics…</div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <MetricCard title="Bank Balance" value={m.bank_balance} icon="account_balance_wallet" accent="lavender" />
          <MetricCard title="Pending Fees" value={m.pending_fees} icon="warning" accent="peach" />
          <MetricCard title="Today's Collections" value={m.today_collections} icon="trending_up" accent="mint" />
        </section>
      )}

      {/* Priority Row: Defaulter + Revenue Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <DefaulterPanel />
        <RevenueBreakdown />
      </section>

      {/* Chart Row */}
      <section>
        <MonthlyChart />
      </section>

      {/* Reports Section */}
      <Reports />

      {/* Quick Actions FAB */}
      <QuickActionFab onAction={handleActionClick} />
    </div>
  );
}
```

- [ ] **Step 2: Delete old component files**

Run:
```bash
Remove-Item -LiteralPath "apps/web/src/components/dashboard/BalanceCard.jsx"
Remove-Item -LiteralPath "apps/web/src/components/dashboard/RevenueChart.jsx"
Remove-Item -LiteralPath "apps/web/src/components/dashboard/DefaulterList.jsx"
Remove-Item -LiteralPath "apps/web/src/components/dashboard/QuickActions.jsx"
```

- [ ] **Step 3: Verify Dashboard loads without errors**

Run `pnpm dev` in the root and navigate to the admin dashboard in the browser. Check browser console for import errors, missing component errors, or 404s.

---

### Task 9: Verification

**Files:**
- Check: all modified and new files

- [ ] **Step 1: Verify no import errors**

Check that all imports in new files resolve:
- GlassCard imported in MetricCard, DefaulterPanel, RevenueBreakdown, MonthlyChart
- Icon imported in AdminSidebar, DefaulterPanel, QuickActionFab
- useDashboardQuery imported in DefaulterPanel, MonthlyChart
- All old component imports removed from Dashboard.jsx

- [ ] **Step 2: Verify admin navigation works**

- Check that clicking sidebar items switches between Analytics, Fee Engine, Pending Approvals, etc.
- Check that non-admin roles (guardian, cashier) still see the old TopNavBar links
- Check mobile horizontal scroll works for admin tabs

- [ ] **Step 3: Verify glass + pastel rendering**

- Confirm glass cards show backdrop-blur effect
- Confirm pastel gradient accents render on sidebar active items and card borders
- Confirm metric counter animation still works
- Confirm QuickActionFab opens/closes smoothly
