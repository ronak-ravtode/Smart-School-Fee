# SmartSchool FinTech - Complete Project Specification

> **Status:** Draft v1.0
> **Stack:** React 19 + Vite (frontend), Express.js (backend), PostgreSQL (database), Prisma (ORM)
> **Monorepo:** pnpm workspaces with apps/api, apps/web, packages/*
> **Target:** School fee management platform - DPDP Act 2023 compliant

---

## 1. Project Overview

### 1.1 Problem Statement

Schools in India manage fee collection through fragmented systems: cash ledgers, bank deposits, UPI payments, and manual receipt books with no unified view. Parents lack transparency into fee breakdowns and payment history. Administrators cannot easily track defaulters, reconcile bank statements, or generate financial reports. Existing solutions are either expensive ERP suites or basic payment gateways with no school-specific workflow (KYC, DPDP consent for minors, fee waivers, cheque lifecycle, offline collections).

### 1.2 Product Vision

A secure, DPDP Act 2023-compliant school fee management platform that provides:

- **Parents**: Transparent fee ledger, UPI/QR payment, digital receipts, KYC-linked student onboarding
- **Cashiers**: Offline-first cash/cheque collection with OCR cheque scanning, bank deposit tracking
- **Admins**: Full financial dashboard, fee structure engine, KYC approval workflow, waiver/penalty/reversal management, bank reconciliation, audit trails, CSV reporting

### 1.3 Target Users

| Role | Description | Count Estimate |
|------|-------------|----------------|
| Admin | School administrator - full financial control | 1-3 per school |
| Cashier | Front-desk staff collecting cash/cheque payments | 2-10 per school |
| Guardian | Parent/guardian managing ward fees | 100-5000 per school |

### 1.4 Scale Constraints

- Single-school deployment (no multi-tenant)
- Users: 10-5000 per instance
- Transactions: up to 500/day peak
- Data volume: < 10 GB/year
- Offline support for cashier terminals in low-connectivity areas

---

## 2. Architecture

### 2.1 Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React 19 + Vite 8 | Fast HMR, Tailwind v4, concurrent features |
| Styling | Tailwind CSS v4 | Utility-first, design tokens via @theme |
| Animation | Framer Motion | Spring-based animated counters |
| Charts | Recharts | React-native bar/pie charts |
| Icons | Material Symbols | Variable font, 1000+ icons, no bundle cost |
| Backend | Express.js 4 | Minimal, well-known, adequate for scale |
| ORM | Prisma 5 | Type-safe queries, migrations, relations |
| Database | PostgreSQL | ACID compliance, JSON support |
| Auth | JWT + bcrypt | Stateless, OTP 2FA mock |
| Encryption | AES-256-CBC | Banking fields at rest |
| PDF | PDFKit | Server-side receipt generation |
| Payment | Cashfree sandbox | Indian UPI, HMAC webhooks |
| Offline | IndexedDB + SW | Background sync for collections |
| State | Zustand | No providers, minimal boilerplate |
| HTTP | Axios | Interceptors, default headers |
| Monorepo | pnpm workspaces | Fast, strict, disk-efficient |
| Dev runner | concurrently | Parallel API + web servers |
| Linting | oxlint | Fast Rust-based linter |

### 2.2 System Architecture

```
Browser (Vite :3000) --> Express API (:5000) --> PostgreSQL (:5432)
  |                          |
  | Vite Proxy /api          | Cashfree Sandbox
  v                          v
Service Worker          cashfree.com/pg
(offline queue)
```

### 2.3 Monorepo Layout

```
smart-school-fintech/
apps/
  api/           # Express backend
    src/
      index.js             # Routes + Express setup
      config/              # db.js, cashfree.js
      controllers/         # 10 controllers
      middlewares/          # rbac.js, audit.js
      utils/               # receipts.js, crypto.js
    prisma/
      schema.prisma        # 13 models
      seed.js              # Demo data
  web/           # React SPA
    src/
      pages/               # 15 pages in 4 groups
      components/          # 13 components
      hooks/               # useDashboardQuery
      stores/              # authStore (Zustand)
      utils/               # idb.js (IndexedDB)
packages/         # (empty)
docs/             # Documentation
```

---

## 3. Data Model

### 3.1 Entity Relationships

Guardian (1) --< Student (N)
Guardian (1) --< Cashier (N)
AcademicYear (1) --< FeeStructure (N)
FeeStructure (1) --< FeeAssignment (N)
Student (1) --< FeeAssignment (N)
Student (1) --1 StudentKYC
Student (1) --< Transaction (N)
FeeAssignment (1) --< Transaction (N)
FeeAssignment (1) --< WaiverPenalty (N)
Transaction (1) --1 Receipt
Transaction (1) --< ChequeRecord (N)
Guardian (1) --< WaiverPenalty (N) [approver]
Guardian (1) --< MaintenanceExpense (N) [creator]

### 3.2 Models

**Guardian** (guardians): id, name, mobile (unique), email (unique), passwordHash, role [admin/cashier/employee/guardian]

**Student** (students): id, guardianId (FK), name, class, status [pending/active], consentChecked, consentTimestamp, dob, ocrFlagged

**AcademicYear** (academic_years): id, label, startDate, endDate, isActive

**FeeStructure** (fee_structures): id, academicYearId (FK), name, amount (Decimal), type [tuition/transport/late_fee/other], appliesTo, version

**FeeAssignment** (fee_assignments): id, studentId (FK), feeStructureId (FK), dueDate, status [pending/paid/waived/overdue]

**StudentKYC** (student_kyc): id, studentId (unique FK), docType, docRef (masked), ocrData (JSON), ocrFlagged, bankAccount (encrypted), ifsc (encrypted), passbookPhotoUrl, isBankingComplete

**Cashier** (cashiers): id, userId (unique FK), createdByAdminId (FK), status [active/inactive]

**AuditLog** (audit_logs): id, actorId, actorRole, action, entity, entityId, before (JSON), after (JSON)

**Transaction** (transactions): id, studentId (FK), feeAssignmentId (FK), amount (Decimal), method [UPI/CASH/CHEQUE], status [pending/success/failed/reversed], gatewayRef, receiptNumber (unique), depositedAt, idempotencyKey (unique)

**ChequeRecord** (cheque_records): id, transactionId (FK), chequeNo, bank, depositStatus [deposit_pending/bank_pending/cleared/bounced], bounceReason

**Receipt** (receipts): id, transactionId (unique FK), receiptNumber (unique), fileUrl (base64 PDF text)

**WaiverPenalty** (waivers_penalties): id, studentId (FK), feeAssignmentId (FK), amount (Decimal), type [waiver/penalty], reason, status [pending/approved/rejected], rejectionReason, approvedById (FK), approvedAt

**MaintenanceExpense** (maintenance_expenses): id, description, amount (Decimal), date, category [watchman/cleaning/utilities/repairs/other], createdById (FK)

---

## 4. Authentication

### 4.1 Login Flow

Step 1: POST /api/auth/login { mobile, password }
  -> Verify bcrypt hash
  -> Generate 6-digit OTP (console-logged in dev)
  -> Return { message, mobile, otp }
  -> Lockout after 5 failed attempts (15 min)

Step 2: POST /api/auth/verify-otp { mobile, otp }
  -> Verify OTP from in-memory store (5 min expiry)
  -> Sign JWT { id, role } with 24h expiry
  -> Return { user, token }

### 4.2 Roles & Permissions

| Capability | Admin | Cashier | Guardian |
|------------|-------|---------|----------|
| Financial dashboard | Yes | Cashier view | No |
| Fee CRUD | Yes | No | No |
| Assign fees | Yes | Yes | No |
| Create cashiers | Yes | No | No |
| Approve KYC/override | Yes | No | No |
| Approve waivers | Yes | No | No |
| Process refunds | Yes | No | No |
| Record cash/cheque | Yes | Yes | No |
| Audit logs | Yes | No | No |
| Bank reconciliation | Yes | Yes | No |
| Cheque management | Yes | Yes | No |
| Log expenses | Yes | No | No |
| View fee ledger | No | No | Yes |
| UPI payments | No | No | Yes |
| Download receipts | No | No | Yes |
| Stage 2 KYC | No | No | Yes |
| DPDP consent | No | No | Yes |

### 4.3 Token Management

- Stored in localStorage key "token"
- Set as axios default header: Authorization: Bearer <token>
- 24h expiry, no auto-refresh
- **Gap**: No 401 interceptor - stale token causes dashboard render with all API calls failing

---

## 5. API Reference

### 5.1 Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Health check |
| POST | /api/auth/signup | Register user (guardian/admin) |
| POST | /api/auth/login | Step 1 password verify |
| POST | /api/auth/verify-otp | Step 2 OTP verify |
| POST | /api/auth/forgot-password | Send reset OTP |
| POST | /api/auth/reset-password | Verify OTP + set password |
| POST | /api/payments/webhook | Cashfree callback (HMAC) |
| GET | /api/payments/receipt | Get receipt PDF |

### 5.2 Auth & Admin (JWT required)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/auth/consent | g, a | DPDP consent toggle |
| GET | /api/guardians/students | g, a | Guardian's linked students |
| GET | /api/admin/cashiers | a | List cashiers |
| GET | /api/admin/audit-logs | a | List audit logs |
| GET | /api/admin/students | a, c | All students |
| GET | /api/admin/approvals | a | Pending KYC approvals |
| POST | /api/admin/approvals/:id/verify | a | Approve KYC |
| POST | /api/admin/approvals/:id/override | a | Override + approve |

### 5.3 Fee Engine

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /api/academic-years | a, c, g | List academic years |
| GET | /api/fees/structures | a, c, g | List fee structures |
| POST | /api/fees/structures | a | Create fee structure |
| PUT | /api/fees/structures/:id | a | Update (new version) |
| POST | /api/fees/assignments | a, c | Assign fee to student |
| GET | /api/fees/assignments | a, c, g | List assignments |

### 5.4 KYC

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/students/kyc | g, a | Stage 1 OCR KYC |
| POST | /api/students/kyc/stage2 | g, a | Stage 2 banking KYC |

### 5.5 Payments

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/payments/initiate | g | UPI payment |
| GET | /api/payments/verify | a, c, g | Verify status |
| GET | /api/payments/transactions | a, c, g | List transactions |
| POST | /api/payments/collect-manual | a, c | Manual collection |
| POST | /api/payments/offline | a, c | Offline collection |
| POST | /api/payments/offline/sync | a, c | Batch sync |
| PUT | /api/payments/:id/deposit | a, c | Mark deposited |

### 5.6 Cheques

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /api/cheques | a, c | List cheques |
| PUT | /api/cheques/:id/deposit | a, c | Deposit cheque |
| PUT | /api/cheques/:id/bounce | a, c | Bounce cheque (+Rs 500) |
| PUT | /api/cheques/:id/clear | a, c | Clear cheque |

### 5.7 Waivers, Refunds, Expenses

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/waivers | a, c | Create waiver/penalty |
| GET | /api/waivers | a, c | List waivers |
| PUT | /api/waivers/:id/approve | a | Approve |
| PUT | /api/waivers/:id/reject | a | Reject |
| POST | /api/refunds | a | Refund reversal |
| POST | /api/expenses | a | Create expense |
| GET | /api/expenses | a | List expenses |

### 5.8 Reconciliation & Dashboard

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/reconciliation/upload | a, c | CSV bank statement match |
| GET | /api/dashboard/metrics | a | Financial KPIs |
| GET | /api/dashboard/revenue-breakdown | a | Revenue by fee type |
| GET | /api/dashboard/defaulters | a | Overdue risk list |
| GET | /api/dashboard/reports | a | Revenue report |

Roles: a=admin, c=cashier, g=guardian

---

## 6. Frontend Pages

### 6.1 Navigation

No router library. State-based routing via useState in App.jsx. Page transitions managed through setPage() calls. Dashboard tab navigation via setDashboardTab().

### 6.2 Page Inventory

**Auth Pages (3)**

| Page | File | Description |
|------|------|-------------|
| Login | pages/auth/Login.jsx | 2-step login: password then OTP. Shows mock OTP in dev. |
| Signup | pages/auth/Signup.jsx | Register guardian/admin. OCR doc upload for stage 1 KYC. |
| Forgot Password | pages/auth/ForgotPassword.jsx | 2-step reset: mobile OTP then new password. |

**Admin Pages (7)**

| Page | File | Description |
|------|------|-------------|
| Dashboard | pages/admin/Dashboard.jsx | KPIs, revenue chart, defaulter list, reports, quick actions, waiver modal. 5s auto-refresh. |
| Fee Setup | pages/admin/FeeSetup.jsx | Create/edit fee structures (versioned). Assign fees to students. |
| Approvals | pages/admin/Approvals.jsx | 3-tab: OCR approvals (verify/override), waiver/penalty approvals, refund processing. |
| Cashier Setup | pages/admin/CashierSetup.jsx | Create cashier accounts. Cashier list + audit log table with expandable JSON. |
| Reconciliation | pages/admin/Reconciliation.jsx | Upload/paste CSV. Auto-match by date+amount against transactions. |
| Expenses | pages/admin/Expenses.jsx | Log operational expenses (5 categories). View history. |
| Reports | pages/admin/Reports.jsx | Revenue report with class/date filters. CSV export. |

**Cashier Pages (3)**

| Page | File | Description |
|------|------|-------------|
| Collections | pages/cashier/Collections.jsx | Search student. Select pending fee. Record CASH/CHEQUE. OCR cheque scanner. Offline-first with IndexedDB. |
| Offline Queue | pages/cashier/OfflineQueue.jsx | View queued offline payments. Manual sync. Online/offline badge. |
| Deposits | pages/cashier/Deposits.jsx | Cheque lifecycle: mark deposited, clear, bounce (with reason + Rs 500 penalty). |

**Guardian Pages (4)**

| Page | File | Description |
|------|------|-------------|
| Payment | pages/guardian/Payment.jsx | Select ward. View fee ledger. Pay via UPI QR. Download receipt PDF. |
| Payment Success | pages/guardian/PaymentSuccess.jsx | Polls verify every 2s (max 30s). Success/failed/error states. Receipt download. |
| Receipts | pages/guardian/Receipts.jsx | Transaction history. PDF download. Request refund (triggers Stage 2 KYC). |
| Stage 2 KYC | pages/guardian/Stage2KYC.jsx | Banking details: account number, IFSC, passbook photo. Encrypted at rest. |

### 6.3 Dashboard Tab Navigation

**Admin**: Analytics, Cashier Setup, Fee Engine, Pending Approvals, Bank Reconciliation, Maintenance Expenses

**Cashier**: Collect Fees, Offline Queue, Cheque Deposits

**Guardian**: My Wards, Pay Fees, Receipt History

---

## 7. Design System

### 7.1 Color Palette

**Neutrals**: canvas-cream (#F3F0EE), lifted-cream (#FCFBFA), ink-black (#141413), surface (#FAF9F8), surface-variant (#E3E2E1), surface-container (#EEEEED), surface-container-low (#F4F3F2), surface-container-high (#E9E8E7), on-surface (#1A1C1C), on-surface-variant (#464742), outline (#767872), outline-variant (#C7C7C0), dust-taupe (#D1CDC7)

**Accents**: signal-orange (#CF4500), light-signal-orange (#F37338), clay-brown (#9A3A0A), link-blue (#3860BE)

**Semantic**: error (#BA1A1A), error-container (#FFDAD6), success (#2E7D32), success-container (#E8F5E9), warning (#E65100), warning-container (#FFF3E0), pending (#E37400), pending-container (#FEF7E0)

**Pastels**: lavender, peach, mint, rose, sky, purple, coral, teal, pink, periwinkle

### 7.2 Typography

- Font: Hanken Grotesk (Google Fonts)
- Body: 16px, weight 450
- Headlines: weight 500, letter-spacing -0.02em
- Eyebrow: orange, uppercase, tracking-wider
- Nav buttons: weight medium

### 7.3 Spacing & Radius

- Page padding: 24px mobile, 48px desktop
- Card padding: 40px
- Section gaps: 64px/96px/128px
- Max width: 1280px
- Frame radius: 40px (cards, modals)
- Full radius: 9999px (badges, pills)

### 7.4 Shadows

- subtle: 0 10px 24px -10px rgba(0,0,0,0.04)
- lifted: 0 20px 48px -12px rgba(0,0,0,0.08)
- deep: 0 30px 110px -20px rgba(0,0,0,0.25)

---

## 8. Components

### Primitives (Primitives.jsx)

Card, PillButton (4 variants), StatusBadge (9 tones), Eyebrow, InputField, SelectField, Alert (2 tones)

### Layout

TopNavBar (role-tabbed floating nav), PageShell (max-width content wrapper), Footer (4 links + copyright), SectionTitle (eyebrow + title), OrbitalDeco (decorative SVG)

### Dashboard

BalanceCard (animated INR counter, color-coded), RevenueChart (bar/pie toggle, Recharts, filters), DefaulterList (profile cards, WhatsApp link, AI risk badge), GlassCard (glassmorphism), QuickActions (fixed FAB group)

### Shared

Icon (Material Symbols wrapper), OCRUpload (Tesseract.js browser OCR, dev mock buttons), PaymentButton (UPI QR modal, webhook simulation), WardsPanel (student list + DPDP consent toggle)

---

## 9. Key Workflows

### 9.1 User Onboarding

Login -> Signup -> fill credentials -> select role guardian -> enter ward details -> upload ID doc -> OCR verify -> DPDP consent -> submit -> admin approves KYC -> student active -> fees auto-assigned -> login -> pay

### 9.2 Fee Payment (Guardian UPI)

Login -> Pay Fees tab -> select ward -> view fee ledger -> click Pay UPI -> scan QR -> simulate callback -> poll verify -> download receipt PDF

### 9.3 Cash Collection (Cashier)

Login -> Collect Fees tab -> search student -> select pending fee -> choose CASH/CHEQUE -> if CHEQUE upload image OCR -> record payment -> if offline queue to IndexedDB -> sync later

### 9.4 Cheque Lifecycle

Record CHEQUE payment (deposit_pending) -> mark deposited (bank_pending) -> clear -> receipt generated. OR bounce -> fee reopened + Rs 500 penalty auto-applied.

### 9.5 Waiver/Penalty

Admin/Cashier creates waiver/penalty request (pending) -> Admin reviews in Approvals tab -> approves (marks fee waived) or rejects with reason.

### 9.6 Bank Reconciliation

Download bank CSV -> upload to Reconciliation page -> backend matches by date+amount -> view matched/unmatched tables.

### 9.7 Refund Processing

Guardian requests refund -> checks Stage 2 KYC -> if missing, submits banking details (encrypted) -> Admin processes refund under Approvals tab -> reversal transaction created + refund receipt generated.

---

## 10. Offline Support

- Service Worker registers at /sw.js
- IndexedDB database "payment-queue" with "payments" store (keyed by idempotency_key)
- SW intercepts POST /api/payments/offline on fetch failure -> queues to IndexedDB
- Background Sync tag "sync-payments" replays queued payments when online
- Client-side also has IndexedDB helpers in idb.js (duplicated from SW)
- useDashboardQuery hook polls dashboard endpoints every 5s

---

## 11. Seed Data

| Role | Name | Mobile | Password |
|------|------|--------|----------|
| Admin | Super Admin | 9265218085 | password123 |
| Cashier | Primary Cashier | 9898989898 | password123 |
| Guardian | Rajeshbhai Ravtode | 9696969696 | password123 |

Academic Year 2026-27, 2 fee structures (Tuition Rs 25k, Transport Rs 5k), 1 student (Grade 5-A, active, KYC verified), 2 assignments (1 pending, 1 overdue), 2 failed UPI transactions.

---

## 12. Identified Gaps

| Issue | Priority | Description |
|-------|----------|-------------|
| No 401 interceptor | High | Stale localStorage token causes broken dashboard |
| Auth middleware masks DB errors | Medium | Generic 401 even on DB connection failure |
| Vite port 3000 conflicts with API | Medium | Change Vite port to 5173 |
| No token refresh | Medium | 24h token, no refresh mechanism |
| SW code duplication | Low | IndexedDB helpers in sw.js + idb.js |
| Browser OCR heavy | Low | Tesseract.js ~10MB WASM download |
| No proper router | Low | No react-router, breaks back/forward nav |
| No frontend tests | Low | Only API has verify scripts |
| No multi-tenant | Info | Single-school design |

---

## 13. Environment

```
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/smart_school?schema=public
JWT_SECRET=smart_school_jwt_secret_dev_2026
PORT=5000
CASHFREE_CLIENT_ID=TEST...
CASHFREE_CLIENT_SECRET=TEST...
FRONTEND_URL=http://localhost:5173
ENCRYPTION_KEY=smart_school_secret_encryption_key_2026
```

---

## 14. Summary

### Fully Defined

- 13-table data model, full schema
- 40+ API endpoints, RBAC, audit logging
- 15 frontend pages, component hierarchy
- Design system: colors, typography, spacing, shadows, radii
- Auth: password + OTP 2FA, JWT, role checks
- Payments: UPI QR, cash, cheque, offline queue
- Cheque lifecycle: deposit, bounce, clear, penalties
- Fee engine: structures, versioning, assignments, waivers
- KYC: OCR stage 1, banking stage 2, admin approval
- Bank reconciliation: CSV matching
- Dashboard: KPIs, revenue charts, defaulter risk, reports
- Offline: Service Worker, IndexedDB, Background Sync
- Seed data with demo accounts

### Remains Open

- Axios 401 interceptor (critical UX fix)
- pnpm install + DB migration + seed (prerequisite for running)
- Vite port conflict resolution
- Production build/deployment config
- Frontend tests
- React error boundaries
- Loading skeleton components
- Token auto-refresh
