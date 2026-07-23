# Admin Dashboard Redesign — Smart School FinTech

**Date**: 2026-07-20
**Hackathon**: Smart School FinTech Innovation Challenge

## Scope

Full restructure of the admin dashboard only. Auth, guardian, and cashier pages retain current brand. Dashboard gets pastel glassmorphism treatment.

## Approach

**Approach B** — Full Dashboard Restructure: new sidebar navigation + new content layout + new glass-pastel visual identity.

## Navigation Restructure

Replace existing horizontal pill tab bar (in TopNavBar) with a **glass sidebar** on desktop:

- Left-aligned frosted glass sidebar with backdrop-blur
- Items: Analytics, Fee Engine, Approvals, Cashier Setup, Reconciliation, Expenses
- Active item highlighted with pastel gradient accent
- Mobile: collapses to floating bottom tab bar or slide-out drawer

Existing TopNavBar remains for role-level navigation (admin/cashier/guardian) and user menu.

## Dashboard Content Layout

```
Hero Row:     [Bank Balance] [Pending Fees] [Today's Collections]
Priority Row: [Defaulter Tracking] [Revenue Breakdown]
Chart Row:    [Monthly Revenue Chart — bar/line toggle]
Quick Actions: Floating FAB group (glass, bottom-right)
```

### Hero Metric Cards (3)
- Glass card with backdrop-blur, pastel gradient accent per card
- Animated number counters (keep existing Framer Motion)
- Icon + label + value + optional trend indicator

### Defaulter Tracking (Priority)
- Ranked list of defaulters sorted by days overdue
- Each entry: glass avatar/initial, student name, class, amount overdue, priority badge (High/Medium/Low)
- Quick-action button per entry: "Send Reminder"

### Revenue Breakdown
- Pie or donut chart (Recharts) showing fee category split
- Categories: Tuition, Transport, Cafeteria & Extras
- Glass container with pastel chart colors matching card accents

### Monthly Revenue Chart
- Bar chart with line overlay toggle
- 12-month view
- Glass container, sky blue/periwinkle pastel tones

### Quick Actions (FAB group)
- Floating bottom-right, glass background
- Actions: Send Reminder, Waive Fee, Add Expense, Export Report
- Waive Fee opens existing modal (restyle with glass)

## Visual Identity

### Glass Card System
```css
backdrop-filter: blur(20px)
background: rgba(255, 255, 255, 0.6)
border: 1px solid rgba(255, 255, 255, 0.5)
box-shadow: 0 8px 32px rgba(pastel-hue, 0.1)
border-radius: 20px
```

### Pastel Accent Gradients
| Card | Gradient |
|------|----------|
| Bank Balance | Lavender → soft purple |
| Pending Fees | Peach → coral |
| Today's Collections | Mint → teal |
| Defaulter Panel | Rose → soft pink |
| Revenue Charts | Sky blue → periwinkle |

### Typography
- Keep Hanken Grotesk (matches rest of app)
- Metric numbers: heavier weight, gradient text on hero cards

### Interactive States
- Hover: deeper shadow + slight scale-up (transform: scale(1.02))
- Quick actions: pastel gradient fills, white text
- Smooth transitions (0.2s-0.3s ease)

## Tailwind Theme Additions

Add dashboard-specific pastel tokens to `index.css`:
```css
--pastel-lavender: #e8e0f0;
--pastel-peach: #fde8d0;
--pastel-mint: #d0f0e0;
--pastel-rose: #f0d8e0;
--pastel-sky: #d0e8f8;
--pastel-purple: #c8b8e8;
--pastel-coral: #f8c8b8;
--pastel-teal: #b8e8d8;
--pastel-pink: #e8b8c8;
--pastel-periwinkle: #b8c8e8;
```

## Component Changes

### New/Modified Components

| Component | Action | Description |
|-----------|--------|-------------|
| `AdminSidebar` | **New** | Glass sidebar for admin sub-navigation |
| `GlassCard` | **New** | Reusable frosted glass card with accent gradient |
| `MetricCard` | **New** | Hero metric card (uses GlassCard + animated counter) |
| `DefaulterPanel` | **New** | Priority-ranked defaulter list with glass styling |
| `RevenueBreakdown` | **New** | Donut chart + category list in glass card |
| `MonthlyChart` | **New** | Bar/line toggle chart in glass card |
| `QuickActionFab` | **New** | Floating glass action button group |
| `Dashboard.jsx` | **Rewrite** | New layout using above components |
| `BalanceCard.jsx` | **Remove** | Replaced by MetricCard |
| `RevenueChart.jsx` | **Remove** | Split into RevenueBreakdown + MonthlyChart |
| `DefaulterList.jsx` | **Remove** | Replaced by DefaulterPanel |
| `QuickActions.jsx` | **Remove** | Replaced by QuickActionFab |
| `TopNavBar.jsx` | **Modify** | Remove admin tabs from pill nav (keep role nav) |
| `App.jsx` | **Modify** | Add sidebar to admin layout, update routing |
| `index.css` | **Modify** | Add pastel tokens, glass utilities |

### Files Unchanged
- All non-admin pages (auth, guardian, cashier)
- Primitives.jsx (Card, PillButton, etc. — still used elsewhere)
- Backend, hooks, stores, utils

## Implementation Order

1. Add pastel tokens + glass utilities to `index.css`
2. Create `GlassCard` component
3. Create `MetricCard` component (hero metrics)
4. Create `AdminSidebar` component
5. Modify `App.jsx` to use sidebar for admin layout
6. Modify `TopNavBar.jsx` — remove admin tabs
7. Rewrite `Dashboard.jsx` with new layout
8. Create `DefaulterPanel` component
9. Create `RevenueBreakdown` component
10. Create `MonthlyChart` component
11. Create `QuickActionFab` component
12. Remove old components (BalanceCard, RevenueChart, DefaulterList, QuickActions)
13. Verify all admin tabs render correctly with new sidebar
