# CV EPIC Warehouse - Business Flow V4

**Document Version:** 1.0.0  
**Audit Date:** 2026-06-10  
**Purpose:** Design future business workflow based on existing database and features (V4)

---

## Document Overview

This document designs the ideal business workflow for the CV EPIC Warehouse Inventory Control Suite. It maps existing modules to new workflows, defines role-specific paths, and provides a complete operational blueprint for V4 implementation.

**Design Principles:**
- No code modifications
- No database schema changes
- Uses existing database tables and features
- Extends current functionality
- Clear role-based access patterns

---

## 1. Existing Modules Analysis

### 1.1 Module Inventory

| Module | Current Status | Capabilities | Gap Analysis |
|--------|---------------|--------------|--------------|
| **Dashboard** | ✅ Active | KPI, charts, mini-review, outlet transactions | Missing user-specific dashboard |
| **Inventory (Persediaan)** | ✅ Active | Stock overview, product list, restock warnings | No category filtering, no reorder automation |
| **Penjualan** | ✅ Active | Sales input, CSV import, templates | No approval workflow, no customer management |
| **Forecast** | ✅ Active | EMA-based prediction, buffer calculation | Not integrated with purchase planning |
| **Opname** | ✅ Active | Commands, scan/input, results, history | Missing approval workflow, no recount |
| **Users** | ⚠️ Partial | User list (in JS), no UI tab | No user registration, no role management UI |
| **Approval Center** | ⚠️ Hidden | Code exists, no sidebar menu | Not integrated with any workflow |
| **Task Center** | ⚠️ Hidden | Code exists, no sidebar menu | Not connected to opname commands |
| **Reports** | ⚠️ Hidden | Code exists, no sidebar menu | No export functionality |

### 1.2 Module Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                     DASHBOARD (Hub)                         │
│  ├── KPI Widgets (from Penjualan, Persediaan, Opname)       │
│  ├── Activity Feed (from all modules)                      │
│  └── Quick Actions (navigate to modules)                   │
└─────────────────────────────────────────────────────────────┘
         │           │           │           │
         ▼           ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │Penjualan│ │Persediaa│ │Forecast │ │ Opname  │
   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
        │           │           │           │
        └───────────┴───────────┴───────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Approval Center│
              │  Task Center    │
              │  Reports        │
              └─────────────────┘
```

---

## 2. Role-Based Workflow Design

### 2.1 Role Definitions

| Role | Code Value | Description | Primary Access |
|------|------------|-------------|----------------|
| **Admin** | `admin` | Full system access, manages users and settings | All modules |
| **Staff Gudang** | `staff_gudang` | Warehouse operations, stock management | Opname, Persediaan |
| **Checker Opname** | `checker_opname` | Stock counting and verification | Opname tasks only |

### 2.2 Admin Workflow

```
ADMIN DASHBOARD
     │
     ├── Quick Stats Widget
     │   ├── Total Penjualan (today/month/year)
     │   ├── Stok Minimum Alert Count
     │   ├── Pending Opname Count
     │   └── Pending Approval Count
     │
     ├── Recent Activity Feed
     │   └── Last 10 activities across all modules
     │
     ├── Quick Actions
     │   ├── + Buat Perintah Opname
     │   ├── + Input Penjualan
     │   ├── + Tambah Produk
     │   └── 📊 Generate Report
     │
     └── Navigation Menu
         ├── Dasbor (Dashboard)
         ├── Operasional
         │   ├── Penjualan
         │   ├── Persediaan
         │   ├── Forecast
         │   └── Stok Opname
         ├── Manajemen
         │   ├── Pengguna
         │   ├── Pengaturan
         │   └── Audit Logs
         └── Persetujuan
             ├── Approval Center
             ├── Task Center
             └── Reports
```

**Admin Daily Operations:**

1. **Morning Check**
   - Review KPI dashboard
   - Check pending approvals
   - Review stock alerts

2. **Operational Tasks**
   - Create/update opname commands
   - Approve/reject submissions
   - Monitor outlet performance

3. **Management Tasks**
   - User management (add/edit/ deactivate)
   - Settings configuration
   - Generate reports

### 2.3 Staff Gudang Workflow

```
STAFF GUDANG DASHBOARD
     │
     ├── My Stats Widget
     │   ├── My Completed Opname Count (this month)
     │   ├── My Pending Tasks
     │   └── My Performance Score
     │
     ├── My Tasks List
     │   └── Active opname commands assigned to me
     │
     └── Quick Actions
         ├── 🔍 Start Opname Scanning
         ├── 📋 View My History
         └── 👤 My Profile
```

**Staff Gudang Daily Operations:**

1. **Morning**
   - Check assigned opname tasks
   - Review task priorities

2. **Execution**
   - Perform physical counting
   - Submit counted results
   - Mark items as complete

3. **End of Day**
   - Review submitted tasks
   - Check for pending adjustments

### 2.4 Checker Opname Workflow

```
CHECKER OPNAME DASHBOARD
     │
     ├── My Stats Widget
     │   ├── Items Checked (this session)
     │   ├── Items Remaining
     │   └── Discrepancy Count
     │
     ├── Active Opname Session
     │   ├── Current location/rack
     │   ├── Items to count
     │   └── Progress indicator
     │
     └── Quick Actions
         ├── 📱 Start Scanning
         ├── ✏️ Manual Input
         └── 📤 Submit Results
```

**Checker Opname Daily Operations:**

1. **Assignment**
   - Receive opname command notification
   - View assigned items/locations

2. **Counting**
   - Scan barcode or search product
   - Enter physical quantity
   - Add notes for discrepancies

3. **Submission**
   - Review counted items
   - Submit for review

---

## 3. Registration Workflow

### 3.1 User Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     REGISTRATION WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   REGISTER   │────▶│   PENDING    │────▶│   APPROVED   │
│   (Step 1)   │     │   (Step 2)   │     │   (Step 3)   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                         ┌──────────────┐
                                         │   ACTIVE     │
                                         │   (Step 4)   │
                                         └──────────────┘
```

### 3.2 Registration Steps

**Step 1: Register (Public)**

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Username | text | Unique, 3-50 chars, alphanumeric | ✅ |
| Email | email | Valid format, unique | ✅ |
| Password | password | Min 8 chars, 1 uppercase, 1 number | ✅ |
| Confirm Password | password | Must match password | ✅ |
| Full Name | text | 2-100 chars | ✅ |
| Phone | text | Valid format (optional) | ❌ |
| Role Requested | select | staff_gudang / checker_opname | ✅ |
| Outlet Assignment | select | List of outlets (optional) | ❌ |

**System Actions:**
- Hash password (PBKDF2)
- Create user record with `status = pending`
- Send notification to admin
- Show "Registration submitted" message

**Step 2: Pending Approval (Admin Notification)**

| Admin Action | System Behavior |
|--------------|-----------------|
| View pending registrations | List all users with status = pending |
| Review registration details | View submitted information |
| Approve registration | Set status = approved, send email |
| Reject registration | Set status = rejected, send reason |

**Step 3: Approved (User Notification)**

| User Action | System Behavior |
|-------------|-----------------|
| Receive approval email | Contains login credentials |
| First login | Prompt to change password |
| Complete profile | Add additional information |
| Access assigned modules | Based on approved role |

**Step 4: Active User**

| Status | Description |
|--------|-------------|
| is_active = true | Full access to assigned role |
| can_login = true | Authentication enabled |
| last_login tracked | For audit purposes |

### 3.3 Registration State Machine

```
┌─────────┐   Submit    ┌─────────┐   Approve   ┌─────────┐  First Login  ┌────────┐
│  NEW    │───────────▶│ PENDING │───────────▶│APPROVED │─────────────▶│ ACTIVE │
└─────────┘             └─────────┘             └─────────┘              └────────┘
                            │
                            │ Reject
                            ▼
                      ┌───────────┐
                      │ REJECTED  │
                      └───────────┘
                            │
                            │ Resubmit
                            ▼
                      ┌─────────┐
                      │   NEW   │
                      └─────────┘
```

### 3.4 Registration API Design

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/v1/auth/register` | POST | Submit registration | Public |
| `/api/v1/users/pending` | GET | List pending users | Admin |
| `/api/v1/users/{id}/approve` | POST | Approve user | Admin |
| `/api/v1/users/{id}/reject` | POST | Reject user | Admin |
| `/api/v1/users/{id}/activate` | POST | Activate approved user | Admin |

---

## 4. Approval Workflow

### 4.1 Approval Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPROVAL WORKFLOW                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   PENDING    │────▶│  IN REVIEW   │────▶│   APPROVED   │
│   (Step 1)   │     │   (Step 2)   │     │   (Step 3)   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   REJECTED   │     │  CHANGES     │     │   APPLIED    │
│   (Step 4)   │     │  REQUESTED   │     │   (Step 5)   │
└──────────────┘     │   (Step 6)   │     └──────────────┘
                     └──────────────┘
```

### 4.2 Approval Types

| Type | Source | Approver | Post-Approval Action |
|------|--------|----------|---------------------|
| **User Registration** | New user signup | Admin | Send activation email |
| **Opname Results** | Checker submission | Admin | Apply stock adjustments |
| **Stock Adjustment** | Manual adjustment | Admin | Update inventory |
| **Outlet Creation** | New outlet request | Admin | Make outlet active |
| **Product Creation** | New product request | Admin | Make product available |
| **Import Data** | Bulk import preview | Admin | Commit import |
| **Opname Recount** | Discrepancy report | Admin | Reset opname session |

### 4.3 Approval Center UI

**Main View: Pending Approvals List**

| Column | Description |
|--------|-------------|
| ID | Unique approval reference |
| Type | User / Opname / Adjustment / Import |
| Submitted By | User who initiated |
| Submitted Date | Timestamp |
| Status | Pending / In Review / Approved / Rejected |
| Actions | View / Approve / Reject / Request Changes |

**Detail View: Approval Item**

```
┌─────────────────────────────────────────────────────────────┐
│  APPROVAL #APPR-2024-001                                    │
├─────────────────────────────────────────────────────────────┤
│  Type: Opname Results                                       │
│  Submitted By: John Doe (checker_opname)                    │
│  Submitted Date: 2024-01-15 14:30                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SUMMARY                                                    │
│  ├── Location: Warehouse A                                  │
│  ├── Total Items: 150                                       │
│  ├── Items Matched: 140                                     │
│  ├── Items Over: 5                                         │
│  ├── Items Under: 5                                        │
│  └── Total Adjustment Value: Rp 500.000                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  DISCREPANCIES                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SKU-001 | Product A | System: 100 | Actual: 95 | -5 │   │
│  │ SKU-002 | Product B | System: 50  | Actual: 55 | +5 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  REVIEWER NOTES                                             │
│  [Enter notes about this approval...]                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ACTIONS                                                    │
│  [Approve]  [Reject]  [Request Changes]  [View History]    │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Approval Actions

**1. Approve**

| Step | Action | Result |
|------|--------|--------|
| 1 | Review all items | Verify completeness |
| 2 | Add approval note | Document decision |
| 3 | Click Approve | Status → Approved |
| 4 | System applies changes | Stock updated |
| 5 | Notify submitter | Email/in-app notification |

**2. Reject**

| Step | Action | Result |
|------|--------|--------|
| 1 | Select rejection reason | Predefined or custom |
| 2 | Add rejection notes | Explain why rejected |
| 3 | Click Reject | Status → Rejected |
| 4 | Optionally assign rework | Create task |
| 5 | Notify submitter | Email with reason |

**3. Request Changes**

| Step | Action | Result |
|------|--------|--------|
| 1 | Select items needing changes | Mark specific items |
| 2 | Add change instructions | Clear guidance |
| 3 | Click Request Changes | Status → Changes Requested |
| 4 | Notify submitter | Email with instructions |
| 5 | Submitter resubmits | Return to Pending |

### 4.5 Approval API Design

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/v1/approvals` | GET | List pending approvals | Admin |
| `/api/v1/approvals/{id}` | GET | Get approval details | Admin |
| `/api/v1/approvals/{id}/approve` | POST | Approve item | Admin |
| `/api/v1/approvals/{id}/reject` | POST | Reject item | Admin |
| `/api/v1/approvals/{id}/request-changes` | POST | Request changes | Admin |
| `/api/v1/approvals/{id}/history` | GET | Get approval history | Admin |

---

## 5. Stock Opname Workflow (Detailed)

### 5.1 Opname Workflow State Machine

```
┌─────────────┐   Create     ┌─────────────┐   Assign     ┌─────────────┐
│   DRAFT     │─────────────▶│   CREATED   │─────────────▶│  ASSIGNED   │
└─────────────┘              └─────────────┘              └─────────────┘
                                  │                              │
                                  │ Cancel                       │ Start
                                  ▼                              ▼
                           ┌─────────────┐               ┌─────────────┐
                           │  CANCELLED  │               │IN PROGRESS  │
                           └─────────────┘               └─────────────┘
                                                            │           │
                                                            │ Submit    │ Request
                                                            ▼           │ Recount
                                                     ┌─────────────┐   │
                                                     │  SUBMITTED  │◀──┘
                                                     └─────────────┘
                                                            │
                          ┌────────────────────────────────┤
                          │                                │
                          ▼                                ▼
                   ┌─────────────┐                  ┌─────────────┐
                   │  APPROVED  │                  │   REVIEW   │
                   │  (Done)    │                  │  CHANGES   │
                   └─────────────┘                  │ REQUESTED  │
                          │                          └─────────────┘
                          │ Apply                         │
                          ▼ Adjustments                   │ Resubmit
                   ┌─────────────┐                        │
                   │   APPLIED   │◀───────────────────────┘
                   └─────────────┘
```

### 5.2 Step 1: Create Task (Admin)

**UI: Create Opname Command Form**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Title | text | ✅ | Opname session name |
| Target Date | date | ✅ | Target completion date |
| Location | select | ✅ | Outlet/warehouse selection |
| Scope | radio | ✅ | Full / Partial |
| Category | multi-select | ❌ | Modul / Seragam / Poster / Lainnya |
| Priority | select | ❌ | Normal / High / Urgent |
| Notes | textarea | ❌ | Additional instructions |

**System Actions:**
- Create `stok_opname_session` record
- Set `status = draft`
- Generate opname code (e.g., SO-2024-001)
- Show in admin dashboard

### 5.3 Step 2: Assign User (Admin)

**UI: Assign Counter Modal**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Assigned To | select | ✅ | User from staff_gudang or checker_opname |
| Assignment Type | radio | ✅ | Individual / Team |
| Due Date | date | ✅ | Counter deadline |
| Instructions | textarea | ❌ | Special instructions |

**System Actions:**
- Create `stok_opname_perintah` record
- Set session `status = assigned`
- Send notification to assigned user
- Update user's task list

### 5.4 Step 3: Execute (User/Checker)

**UI: Scan & Input Interface (Mobile-First)**

```
┌─────────────────────────────────────────┐
│  OPname Session: SO-2024-001           │
│  Location: Warehouse A                 │
│  Progress: 45/150 items (30%)          │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🔍 Scan Barcode or Enter SKU    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  SCAN RESULT:                           │
│  ┌─────────────────────────────────┐   │
│  │  SKU-001: Product Name A        │   │
│  │  System Qty: 100                │   │
│  │  ┌─────────────────────────┐    │   │
│  │  │  Physical Qty: [  95  ]│    │   │
│  │  └─────────────────────────┘    │   │
│  │  Difference: -5 (UNDER)         │   │
│  │  Notes: [Optional notes...]     │   │
│  │  [SAVE] [SKIP] [FLAG]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  RECENT SCANS:                          │
│  ✓ SKU-002: Counted (50)               │
│  ✓ SKU-003: Counted (30)              │
│  ⚠ SKU-004: Flagged for review        │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Barcode scanning (camera integration)
- Manual SKU entry
- Auto-save after each item
- Progress indicator
- Discrepancy highlighting
- Skip/Flag options

### 5.5 Step 4: Submit (User/Checker)

**UI: Submit Confirmation**

| Section | Description |
|---------|-------------|
| Summary | Total items counted, match rate |
| Discrepancies | List of items with differences |
| Attachments | Photos/evidence (optional) |
| Notes | Submitter comments |

**Validation:**
- All assigned items must be counted
- All discrepancies must have notes
- Confirmation required

### 5.6 Step 5: Review (Admin)

**UI: Review Opname Results**

```
┌─────────────────────────────────────────────────────────────┐
│  OPNAME REVIEW: SO-2024-001                                │
├─────────────────────────────────────────────────────────────┤
│  Counter: John Doe | Submitted: 2024-01-15 15:00           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RESULTS SUMMARY                                            │
│  ├─ Total Items: 150                                      │
│  ├─ Matched: 140 (93.3%)                                  │
│  ├─ Over: 5 (items with + difference)                     │
│  └─ Under: 5 (items with - difference)                     │
│                                                             │
│  CRITICAL DISCREPANCIES (>$100,000)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SKU-010 | Product X | System: 50 | Actual: 40 | -10 │   │
│  │ Value Diff: Rp 500,000 | Reason: [Enter reason...]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  APPROVAL CHECKLIST                                        │
│  ☑ All items counted                                      │
│  ☑ Discrepancies documented                               │
│  ☑ Photos attached (if needed)                             │
│  ☐ Finance verified (if > threshold)                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [APPROVE & APPLY] [APPROVE PENDING ADJUSTMENT]           │
│  [REQUEST RECOUNT] [REJECT]                                │
└─────────────────────────────────────────────────────────────┘
```

### 5.7 Step 6: Approve (Admin)

**UI: Approval Confirmation**

| Action | Result |
|--------|--------|
| Approve & Apply | Stock adjusted, session closed |
| Approve Pending | Stock adjusted pending finance review |
| Request Recount | Session reopened for specific items |
| Reject | Session closed, no adjustments |

**System Actions:**
- Update session `status = approved`
- Create `stok_opname_adjustment` records
- Apply adjustments to `stok_mutasi`
- Update `stok_real_time`
- Generate audit log
- Notify counter of completion

### 5.8 Opname API Design

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/v1/opname/sessions` | GET | List opname sessions | Admin |
| `/api/v1/opname/sessions` | POST | Create new session | Admin |
| `/api/v1/opname/sessions/{id}` | GET | Get session details | Admin/User |
| `/api/v1/opname/sessions/{id}/assign` | POST | Assign counter | Admin |
| `/api/v1/opname/sessions/{id}/start` | POST | Start counting | User |
| `/api/v1/opname/sessions/{id}/submit` | POST | Submit results | User |
| `/api/v1/opname/sessions/{id}/approve` | POST | Approve session | Admin |
| `/api/v1/opname/sessions/{id}/reject` | POST | Reject session | Admin |
| `/api/v1/opname/sessions/{id}/recount` | POST | Request recount | Admin |
| `/api/v1/opname/sessions/{id}/adjust` | POST | Apply adjustments | System |

---

## 6. Dashboard Widgets Design

### 6.1 Admin Dashboard Widgets

```
┌────────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD V4                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │ TODAY'S KPIs         │  │ QUICK ACTIONS        │               │
│  │ ┌────────────────┐   │  │ [+ Buat Opname    ]  │               │
│  │ │ Penjualan: X   │   │  │ [+ Input Penjualan]  │               │
│  │ │ Target: Y      │   │  │ [+ Tambah Produk ]  │               │
│  │ │ Gap: Z         │   │  │ [📊 Generate Report]│               │
│  │ └────────────────┘   │  │                      │               │
│  └──────────────────────┘  └──────────────────────┘               │
│                                                                    │
│  ┌──────────────────────────────────────────────┐                 │
│  │ PENDING APPROVALS (3)                        │                 │
│  │ ┌────┬────────────┬─────────┬────────┐       │                 │
│  │ │ #1 │ Opname     │ John D. │ [View] │       │                 │
│  │ │ #2 │ Import     │ Jane S. │ [View] │       │                 │
│  │ │ #3 │ Adjustment │ Mike T. │ [View] │       │                 │
│  │ └────┴────────────┴─────────┴────────┘       │                 │
│  └──────────────────────────────────────────────┘                 │
│                                                                    │
│  ┌────────────────────┐  ┌────────────────────┐                   │
│  │ STOCK ALERTS       │  │ RECENT ACTIVITY    │                   │
│  │ ⚠ Minimum: 12      │  │ • John completed SO │                   │
│  │ 🔴 Over: 3         │  │ • Jane imported 50 │                   │
│  │ 📦 Need Restock: 8 │  │ • System adjusted 5 │                   │
│  └────────────────────┘  └────────────────────┘                   │
│                                                                    │
│  ┌──────────────────────────────────────────────┐                 │
│  │ TOP PRODUCTS THIS MONTH                       │                 │
│  │ ┌─────┬──────────┬────────┬──────────┐       │                 │
│  │ │ SKU │ Product  │ Sold   │ Revenue  │       │                 │
│  │ ├─────┼──────────┼────────┼──────────┤       │                 │
│  │ │001  │ Product A│ 150    │ Rp 7.5M  │       │                 │
│  │ │002  │ Product B│ 120    │ Rp 6.0M  │       │                 │
│  │ └─────┴──────────┴────────┴──────────┘       │                 │
│  └──────────────────────────────────────────────┘                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 6.2 User Dashboard Widgets (Staff Gudang / Checker Opname)

```
┌────────────────────────────────────────────────────────────────────┐
│                     USER DASHBOARD V4                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────┐                 │
│  │ MY PROFILE                                   │                 │
│  │ 👤 John Doe (checker_opname)                 │                 │
│  │ 📍 Warehouse A | 📅 Joined: 2024-01-01       │                 │
│  └──────────────────────────────────────────────┘                 │
│                                                                    │
│  ┌──────────────────────┐  ┌──────────────────────┐                 │
│  │ MY STATS             │  │ MY PERFORMANCE      │                 │
│  │ Opname Done: 15      │  │ Accuracy: 98.5%      │                 │
│  │ Items Checked: 450   │  │ Avg Time: 2.5 hrs   │                 │
│  │ Pending: 3          │  │ Rating: ⭐⭐⭐⭐      │                 │
│  └──────────────────────┘  └──────────────────────┘                 │
│                                                                    │
│  ┌──────────────────────────────────────────────┐                 │
│  │ MY TASKS (Active Opname Commands)            │                 │
│  │ ┌────┬────────┬──────────┬────────┬──────┐  │                 │
│  │ │ #1 │ SO-001 │ Warehouse│ Due:   │[Start]│  │                 │
│  │ │    │        │ A        │ Today  │      │  │                 │
│  │ ├────┼────────┼──────────┼────────┼──────┤  │                 │
│  │ │ #2 │ SO-002 │ Warehouse│ Due:   │[View]│  │                 │
│  │ │    │        │ B        │ 2 days │      │  │                 │
│  │ └────┴────────┴──────────┴────────┴──────┘  │                 │
│  └──────────────────────────────────────────────┘                 │
│                                                                    │
│  ┌──────────────────────────────────────────────┐                 │
│  │ MY HISTORY (Recent Opname Sessions)          │                 │
│  │ ┌────┬────────┬────────┬────────┬────────┐   │                 │
│  │ │ ID │ Date   │ Items  │ Match  │ Status │   │                 │
│  │ ├────┼────────┼────────┼────────┼────────┤   │                 │
│  │ │001 │ Jan 10 │ 50     │ 95%    │✅Done │   │                 │
│  │ │002 │ Jan 08 │ 30     │ 100%   │✅Done │   │                 │
│  │ └────┴────────┴────────┴────────┴────────┘   │                 │
│  └──────────────────────────────────────────────┘                 │
│                                                                    │
│  ┌──────────────────────┐  ┌──────────────────────┐                 │
│  │ MY NOTIFICATIONS     │  │ QUICK ACTIONS       │                 │
│  │ • New task assigned  │  │ [📱 Start Scanning] │                 │
│  │ • Opname approved    │  │ [📋 View History ] │                 │
│  │ • Review reminder    │  │ [👤 My Profile   ] │                 │
│  └──────────────────────┘  └──────────────────────┘                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 6.3 Dashboard Widget API Mapping

| Widget | Data Source | API Endpoint | Refresh |
|--------|-------------|--------------|--------|
| Today's KPIs | Penjualan, Stok | GET /kpi | Every 5 min |
| Pending Approvals | Approval Center | GET /approvals?status=pending | Real-time |
| Stock Alerts | Persediaan | GET /v3-persediaan?alert=true | Every 15 min |
| Recent Activity | Audit Log | GET /activity?limit=10 | Real-time |
| Top Products | Penjualan | GET /top-products | Daily |
| My Tasks | Opname Commands | GET /opname-perintah?assigned_to={user} | Real-time |
| My Stats | Opname History | GET /opname-history?user={id} | Real-time |
| Notifications | Notifikasi | GET /notifications?user={id} | Real-time |

---

## 7. Settings Module Design

### 7.1 Settings Structure

```
SETTINGS (Admin Only)
├── Company Profile
│   ├── Company Name
│   ├── Address
│   ├── Phone / Email
│   ├── Tax ID
│   └── Logo Upload
│
├── Roles & Permissions
│   ├── Role List (Admin, Staff Gudang, Checker Opname)
│   ├── Permission Matrix
│   └── Role Assignment Rules
│
├── Security
│   ├── Password Policy
│   ├── Session Timeout
│   ├── Login Attempts
│   └── API Keys (if any)
│
├── Database Status
│   ├── Connection Status
│   ├── Last Sync
│   ├── Backup Status
│   └── Migration History
│
└── Audit Logs
    ├── User Activity Log
    ├── System Events
    ├── Approval History
    └── Export Options
```

### 7.2 Company Profile Section

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Company Name | text | ✅ | Official company name |
| Address | textarea | ✅ | Warehouse address |
| City | text | ✅ | City location |
| Phone | text | ❌ | Contact number |
| Email | email | ❌ | Contact email |
| Tax ID / NPWP | text | ❌ | Tax identification |
| Logo | file | ❌ | Company logo (PNG/JPG) |

**Behavior:**
- Changes require confirmation
- Logo upload with preview
- Address validation (optional)

### 7.3 Roles & Permissions Section

**Role Configuration:**

| Role | Can Create Opname | Can Approve | Can Manage Users | Can View Reports |
|------|-------------------|-------------|------------------|------------------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Staff Gudang | ❌ | ❌ | ❌ | ❌ |
| Checker Opname | ❌ | ❌ | ❌ | ❌ |

**Permission Matrix:**

| Permission | Admin | Staff Gudang | Checker Opname |
|------------|-------|--------------|----------------|
| View Dashboard | ✅ | ✅ | ✅ |
| Create Opname | ✅ | ❌ | ❌ |
| Execute Opname | ✅ | ✅ | ✅ |
| Approve Opname | ✅ | ❌ | ❌ |
| View Inventory | ✅ | ✅ | ❌ |
| Manage Products | ✅ | ❌ | ❌ |
| View Sales | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ |

### 7.4 Security Section

**Password Policy Configuration:**

| Setting | Default | Options |
|---------|---------|---------|
| Minimum Length | 8 characters | 6-20 |
| Require Uppercase | Yes | Yes/No |
| Require Number | Yes | Yes/No |
| Require Special Char | No | Yes/No |
| Expiry Days | 90 days | 30-365 |
| History Count | 5 | 1-10 |

**Session Configuration:**

| Setting | Default | Options |
|---------|---------|---------|
| Session Timeout | 30 minutes | 15-120 |
| Max Login Attempts | 5 | 3-10 |
| Lockout Duration | 15 minutes | 5-60 |
| Remember Me Duration | 7 days | 1-30 |

### 7.5 Database Status Section

**Status Display:**

```
┌─────────────────────────────────────────────────────────────┐
│  DATABASE STATUS                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Connection: ✅ Connected (Neon PostgreSQL)                 │
│  Last Sync: 2024-01-15 14:30:00                            │
│  Server: neon-host.epic-warehouse.neon.tech                  │
│                                                             │
│  TABLES                                                     │
│  ├─ users: 45 records                                      │
│  ├─ outlets: 12 records                                    │
│  ├─ produk: 1,250 records                                  │
│  ├─ penjualan: 8,432 records                              │
│  └─ stok_opname_session: 156 records                       │
│                                                             │
│  BACKUP                                                     │
│  ├─ Last Backup: 2024-01-15 00:00:00                       │
│  ├─ Backup Size: 45 MB                                     │
│  └─ [Manual Backup] [Configure Auto-Backup]                │
│                                                             │
│  MIGRATIONS                                                 │
│  ├─ Current Version: v3_users (2024-01-10)                │
│  ├─ Pending: None                                          │
│  └─ [View Migration History]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.6 Audit Logs Section

**Log Types:**

| Type | Description | Retention |
|------|-------------|-----------|
| User Activity | Login, logout, profile changes | 90 days |
| System Events | API calls, errors, syncs | 30 days |
| Approval History | Approve, reject, changes | 180 days |
| Data Changes | Create, update, delete records | 90 days |

**Log Viewer:**

| Column | Description |
|--------|-------------|
| Timestamp | When event occurred |
| User | Who performed action |
| Action | What was done |
| Module | Which module affected |
| Details | Additional information |
| IP Address | Where action originated |

**Export Options:**
- CSV export (date range)
- PDF report (summary)
- Email scheduled reports

---

## 8. Integration Summary

### 8.1 Module Integration Points

```
REGISTRATION ──────────────────▶ APPROVAL CENTER ──────────▶ USER MANAGEMENT
                                      │
                                      ▼
                              ┌───────────────┐
                              │   ACTIVITY    │
                              │    LOGS       │
                              └───────────────┘
                                      ▲
                                      │
OPNAME ◀───────────────────────────────┘
   │
   ├──▶ TASK CENTER
   │
   └──▶ DASHBOARD (all roles)

INVENTORY ──────────────────────▶ FORECAST
   │
   └──▶ REPORTS

PENJUALAN ─────────────────────▶ DASHBOARD
```

### 8.2 Notification Flow

| Event | Recipients | Channel | Message |
|-------|-----------|---------|---------|
| New user registered | Admin | In-app, Email | "New registration pending approval" |
| User approved | User | Email | "Your account has been approved" |
| Opname assigned | User | In-app | "You have a new opname task" |
| Opname submitted | Admin | In-app | "Opname #SO-001 awaiting review" |
| Opname approved | User | In-app | "Opname #SO-001 has been approved" |
| Stock alert | Admin | In-app | "12 products below minimum stock" |
| Pending approval reminder | Admin | In-app | "3 approvals pending review" |

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-10 | Initial business flow V4 document |

---

*Document generated by project audit*  
*For implementation planning - No code modifications*