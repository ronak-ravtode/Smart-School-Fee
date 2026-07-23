# SmartSchool Fee — UI Redesign

## Scope

Rebuild 7 admin screens with unified design system. Redesign existing 8 screens (keep logic). Preserve routing, Zustand stores, API layer, auth, build config.

**Rebuild (from scratch):**
- Admin Dashboard
- Dynamic Fee Engine
- Student Fee Profile
- Payments & Collection
- Defaulters
- Reconciliation
- Reports & Analytics

**Redesign (new shell, keep logic):**
- Login
- Auth (signup, forgot password)
- Cashier Dashboard
- Cashier Payment Flow
- Guardian Dashboard
- Guardian Payment History
- Guardian Receipts
- Settings / Profile / Notifications

**Keep unchanged:**
- Routing (App.jsx page state)
- Zustand stores (authStore.js)
- Existing API layer (axios, endpoints)
- Authentication flow
- Protected routes
- Vite config
- Tailwind v4 CSS config

## Design Tokens

### Colors

```
--color-canvas: #f8f6f3           (page background)
--color-surface: #ffffff           (card surface)
--color-surface-glass: rgba(255,255,255,0.7)
--color-ink-black: #141413
--color-ink-secondary: #5f5e5d
--color-ink-muted: #8a8a88
--color-border: rgba(0,0,0,0.08)
--color-border-light: rgba(255,255,255,0.4)
```

### Module Accents

| Module | Accent Hex | Usage |
|--------|-----------|-------|
| Dashboard | Periwinkle #8b8fd4 | Active sidebar, stat cards, chart highlight |
| Students | Mint #6bc9a9 | Active sidebar, badges, icons |
| Fee Engine | Royal Indigo #6c7bd8 | Active sidebar, buttons, icons |
| Payments | Emerald #5bb98a | Active sidebar, status chips, icons |
| Reconciliation | Coral #e8977a | Active sidebar, match indicators, icons |
| Defaulters | Deep Rose #d46a7a | Active sidebar, urgency badges, icons |
| Reports | Amber #e8b86a | Active sidebar, chart highlights, icons |
| Settings | Slate #8a94a5 | Active sidebar, icons |

### Typography

Family: Hanken Grotesk (already loaded)

```
--text-hero: 40px / 1.1    (dashboard hero metrics)
--text-page-title: 30px / 1.2
--text-section: 22px / 1.3
--text-card-title: 18px / 1.4
--text-body: 15-16px / 1.5
--text-caption: 13px / 1.5
--text-small: 12px / 1.5
```

### Border Radius

```
--radius-cards: 12px
--radius-buttons: 10px
--radius-inputs: 10px
--radius-dialogs: 20px
--radius-charts: 12px
--radius-badges: 9999px
--radius-sidebar-indicator: 4px
```

### Elevation

| Level | Use | CSS |
|-------|-----|-----|
| 0 | Canvas | background |
| 1 | Static card | `box-shadow: 0 1px 3px rgba(0,0,0,0.04); backdrop-blur-sm; border: 1px solid rgba(255,255,255,0.4)` |
| 2 | Hover card | `box-shadow: 0 8px 24px rgba(0,0,0,0.08); backdrop-blur-md; border: 1px solid rgba(255,255,255,0.6)` |
| 3 | Modal | `box-shadow: 0 20px 60px rgba(0,0,0,0.15); backdrop-blur-lg; border: 1px solid rgba(255,255,255,0.8)` |
| 4 | Drawer | `box-shadow: 0 0 40px rgba(0,0,0,0.2); backdrop-blur-xl` |

### Spacing

8px increment system: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128

## Navigation

### Left Sidebar

- Fixed left, 240px wide
- Neutral background (`--color-surface`)
- Logo + app name at top
- Nav items: icon + label
- Active item: glass background + 3px gradient left strip (module accent) + colored icon
- Hover: subtle bg change
- Bottom: user avatar, role badge, logout

### Top Context Ribbon

- Below sidebar header
- Current module name + accent dot
- Breadcrumb (for nested pages like Fee Engine > Edit Plan)
- Right side: school year selector, global search, notification bell, sync status

### Page Layout

- Sidebar (fixed) | Main area (scrollable)
- Main: Context Ribbon + Page Content
- Page Content: Section header (eyebrow + title + optional action) + card grid

## Shared Components

### UiPrimitives (refactored)

- `GlassCard` — elevation 1 base, hover -> elevation 2, accent border option
- `StatCard` — metric value with label, icon, trend indicator, animated count
- `PageHeader` — eyebrow, title, subtitle, optional action buttons
- `DataTable` — sticky header, sortable columns, pagination, row actions, bulk select, loading skeleton, empty state
- `StatusChip` — colored badge with dot (success/warning/error/pending/info), maps to module accents
- `SearchInput` — rounded 10px, icon, clear button
- `FilterBar` — horizontal row of select/date/range filters with clear all
- `Modal` — elevation 3, 20px radius, close button, header + body + footer
- `Drawer` — elevation 4, slides from right, 480px max
- `ActionButton` — primary (accent bg), secondary (outline), ghost (no bg)
- `Toast` — auto-dismiss 4s, slide-in, success/error/warning/info variants
- `Skeleton` — shimmer loading placeholder
- `EmptyState` — icon + message + optional CTA
- `MetricTrend` — small up/down arrow + percentage
- `SectionCard` — titled card container with optional accent header strip
- `Avatar` — circular, fallback initial
- `Badge` — count dot for notifications
- `TabBar` — horizontal tabs for sub-sections within a page

### Framer Motion Usage

Only in:
- StatCard number counting (`useMotionValue` + `animate`)
- Drawer open/close (slide + fade)
- Sidebar active indicator (layoutId)
- Skeleton fade in/out
- Card hover elevation (whileHover)
- Chart loading (fade)

### Chart System (Recharts)

- Responsive container
- Module accent as primary color
- 8-12% opacity area fill
- Consistent grid (light gray)
- Tooltip with glass style
- Legend bottom
- Animate on data change (fade)

## Page Specifications

### 1. Admin Dashboard

**Context Ribbon:** "Dashboard" + accent dot (periwinkle)
**Layout:** Top stat row (4 MetricCards) + middle charts (2x2 grid) + bottom activity/defaulter feed

**StatCards (animated count):**
- Total Collected Today (emerald)
- Pending Dues (amber)
- Overdue Amount (rose)
- Defaulters Count (rose)

**Charts:**
- Revenue Trend (line chart, periwinkle)
- Class-wise Collection (bar chart, mint)
- Payment Method Breakdown (donut, mixed accents)
- Defaulter Aging (bar/heatmap, rose shades)

**Widgets:**
- Recent Payments feed (last 10 transactions)
- Priority Alerts (top 3 high-value defaulters)
- Quick Actions row: Collect, Create Invoice, Apply Waiver, Add Penalty
- Sync status indicator

**Framer Motion:** StatCard counting on mount, chart fade-in, hover elevation on cards

### 2. Dynamic Fee Engine

**Context Ribbon:** "Fee Engine" + accent dot (royal indigo)
**Layout:** Left panel (fee component list) + Right panel (preview)

**Fee Component List (DataTable):**
- Columns: Name, Category, Amount, Applies To, Recurrence, Status, Actions
- Row actions: Edit, Duplicate, Archive, Delete
- Bulk select for batch operations
- Status: Draft / Published / Archived

**Fee Structure Builder (Drawer/Full page):**
- Form sections: Basic Info, Fee Items, Rules, Schedule
- Add fee items via drawer
- Rule builder: class/section/route/student type selectors
- Recurrence: One-time / Monthly / Quarterly / Conditional
- Date-based penalty rules
- Waiver/concession at fee-item level

**Preview Panel:**
- Live calculated total
- Itemized breakdown
- Applied rules summary
- Version history list

**Save controls:** Save Draft / Publish / Version History

### 3. Student Fee Profile

**Context Ribbon:** "Students > [Student Name]" + accent dot (mint)

**Top Section (Profile Card):**
- Student photo placeholder, name, class, admission no
- Fee plan name, status badge
- Quick actions: Collect, Adjust, Waive, Print Receipt

**Tabs:**
- Overview (balance card, payment summary)
- Payment History (DataTable: date, fee head, amount, method, status, receipt)
- Fee Breakdown (assigned fee items with amounts)
- Waivers & Penalties (list with status chips)
- Receipts & Invoices (list with download)
- Notes / Flags

**Timeline:** Vertical timeline on Overview showing all transactions + adjustments

### 4. Payments & Collection

**Context Ribbon:** "Payments" + accent dot (emerald)

**Filters:** Date range, Class, Section, Payment Mode, Status, Student search

**DataTable:**
- Columns: Transaction ID, Student, Fee Head, Amount, Method, Status, Date, Operator, Sync Status
- Row actions: View, Print Receipt, Mark Reconciled, Reverse
- Bulk select for reconciliation

**Quick Collect (Drawer):**
- Student search/select
- Outstanding fee items (checkboxes)
- Payment mode: Cash/UPI/Card/Bank Transfer/Cheque/Mixed
- Amount entry
- Receipt preview
- Submit -> success toast + receipt link

**Status Chips:**
- Success (green)
- Pending (amber)
- Failed (rose)
- Reversed (slate)
- Partially Paid (amber)
- Manually Verified (emerald)

### 5. Defaulters

**Context Ribbon:** "Defaulters" + accent dot (deep rose)

**Filters:** Class, Section, Min Amount, Days Overdue, Transport Only

**DataTable:**
- Columns: Student, Class, Overdue Amount, Days Overdue, Fee Items, Contact Status, Last Follow-up
- Color-coding: Critical (red bg), Warning (amber bg), Cleared (green bg), Inactive (grey bg)
- Sort by: risk, amount, days overdue

**Actions:**
- Bulk Reminders (SMS/Email)
- Bulk Penalty Apply
- Mark Contacted (add follow-up note)
- Payment Commitment (record promise date)
- Follow-up History (expandable)

**Top Summary:** Total overdue amount, total defaulters count, average days overdue

### 6. Reconciliation

**Context Ribbon:** "Reconciliation" + accent dot (coral)

**Layout:** Side-by-side matching view

**Left Panel (Bank/UPI Statement):**
- Imported entries table
- Columns: Date, Reference, Amount, Description
- Status: Matched / Unmatched / Suggested

**Right Panel (System Records):**
- Fee transactions table
- Filters: status, date range, payment mode

**Matching Controls:**
- Match confidence indicator (high/medium/low)
- Suggested matches (highlighted pairs)
- Manual override button
- Unmatched entries bucket
- Exception reason dropdown
- Export matched/unmatched report

**Summary Bar:** Total entries, Matched, Unmatched, Exceptions

### 7. Reports & Analytics

**Context Ribbon:** "Reports" + accent dot (amber)

**Layout:** Filter bar (session, class, date range) + chart grid

**Charts (2x2 or 3x2 grid):**
- Revenue Trend (line, amber)
- Collection by Fee Type (bar, mixed accents)
- Collection by Class (bar, mint gradient)
- Outstanding Dues (bar, rose gradient)
- Payment Mode Distribution (donut)
- Defaulter Aging (heatmap)

**Additional:**
- Monthly/Session comparison toggle
- Export Report button
- Drill-down: click chart segment -> filtered DataTable below
- Penalty & Waiver Summary

## Updated Pages (Redesign Only)

### Login

New shell: centered glass card, school logo, email/password inputs (10px radius), primary button (periwinkle). Keep existing validation/submit logic.

### Cashier Dashboard

Reduced metric row + quick collect button + recent collections table. Reuse StatCard, DataTable, FilterBar.

### Guardian Dashboard

Student cards grid (GlassCard) with balance + status. Quick pay button per student. Keep existing data fetching.

### Settings / Profile / Notifications

Tab-based layout. Reuse existing content sections. Apply new card/tab/button system.

## Implementation Plan

### Phase 1: Foundation (shared components)
1. Refactor `src/components/ui/Primitives.jsx` — expand GlassCard, StatCard, DataTable, StatusChip, SearchInput, FilterBar, Modal, Drawer, ActionButton, Toast, Skeleton, EmptyState, PageHeader, TabBar
2. Create `src/components/layout/Sidebar.jsx` — fixed left nav with module accents
3. Update `src/components/layout/TopNavBar.jsx` → ContextRibbon
4. Update `src/components/layout/PageShell.jsx` — integrate sidebar + ribbon
5. Create `src/hooks/useModuleAccent.js` — returns accent color for current module
6. Create `src/stores/uiStore.js` — sidebar state, toast queue, active module

### Phase 2: Rebuild admin pages
7. `src/pages/admin/Dashboard.jsx` — stat cards, charts, widgets, quick actions
8. `src/pages/admin/FeeSetup.jsx` → FeeEngine — component list, builder drawer, preview
9. `src/pages/admin/StudentProfile.jsx` — profile card, tabs, timeline
10. `src/pages/admin/Payments.jsx` — payments table, collect drawer, filters
11. `src/pages/admin/Defaulters.jsx` — defaulter table, bulk actions, filters
12. `src/pages/admin/Reconciliation.jsx` — side-by-side matching view
13. `src/pages/admin/ReportsAnalytics.jsx` — chart grid, filters, export

### Phase 3: Redesign existing pages
14. Update `src/pages/auth/Login.jsx` — new shell
15. Update cashier pages — new component wrappers
16. Update guardian pages — new card system

### Phase 4: Polish
17. Framer Motion micro-interactions
18. Responsive adjustments
19. Loading skeletons everywhere
20. Empty states
21. Toast notifications wiring

## Files to Create

- `src/components/ui/Primitives.jsx` (refactor)
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/ContextRibbon.jsx`
- `src/hooks/useModuleAccent.js`
- `src/stores/uiStore.js`
- `src/components/ui/GlassCard.jsx`
- `src/components/ui/StatCard.jsx`
- `src/components/ui/DataTable.jsx`
- `src/components/ui/StatusChip.jsx`
- `src/components/ui/SearchInput.jsx`
- `src/components/ui/FilterBar.jsx`
- `src/components/ui/Modal.jsx`
- `src/components/ui/Drawer.jsx`
- `src/components/ui/ActionButton.jsx`
- `src/components/ui/Toast.jsx`
- `src/components/ui/Skeleton.jsx`
- `src/components/ui/EmptyState.jsx`
- `src/components/ui/PageHeader.jsx`
- `src/components/ui/TabBar.jsx`
- `src/pages/admin/Dashboard.jsx` (rebuild)
- `src/pages/admin/FeeEngine.jsx` (rebuild)
- `src/pages/admin/StudentProfile.jsx` (new)
- `src/pages/admin/Payments.jsx` (rebuild from Collections)
- `src/pages/admin/Defaulters.jsx` (rebuild from DefaulterList)
- `src/pages/admin/Reconciliation.jsx` (rebuild)
- `src/pages/admin/ReportsAnalytics.jsx` (rebuild from Reports)

## Files to Modify

- `src/App.jsx` — add new routes, update sidebar nav items
- `src/index.css` — add new design tokens under @theme
- `src/components/layout/PageShell.jsx` — integrate Sidebar + ContextRibbon
- Login, cashier, guardian pages — new component wrappers
