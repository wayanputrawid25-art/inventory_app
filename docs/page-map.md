# CV EPIC Warehouse - Page Map

**Document Version:** 1.0.0  
**Audit Date:** 2026-06-10  
**Purpose:** Map every sidebar menu to page, JS file, API endpoint, and database tables

---

## 1. Sidebar Navigation Overview

The application has two role-based sidebars:
- **Admin Sidebar** (for `admin` role)
- **User Sidebar** (for `user` role - staff_gudang, checker_opname)

---

## 2. Admin Sidebar Menu Map

### 2.1 Dasbor Section

| Menu Item | Icon | Page ID | JS Function | Content Tab | API Endpoint | Database Tables |
|-----------|------|---------|-------------|-------------|--------------|-----------------|
| Dasbor | layout-dashboard | `dashboard` | `selectMenu('dashboard')` | `#adminTab` | `GET /v3-dashboard` | `users`, `outlets`, `penjualan` |

### 2.2 Operasional Section

| Menu Item | Icon | Page ID | JS Function | Content Tab | API Endpoint | Database Tables |
|-----------|------|---------|-------------|-------------|--------------|-----------------|
| Penyedia | shopping-cart | `penjualan` | `selectMenu('penjualan')` | `#kpiTab` | `GET /chart`, `GET /kpi` | `penjualan`, `penjualan_detail` |
| Stok Opname | package-check | `opname` | `selectMenu('opname')` | `#opnameTab` | `GET /v3-opname`, `POST /v3-opname` | `stok_opname_session`, `stok_opname_detail` |

### 2.3 Manajemen Section

| Menu Item | Icon | Page ID | JS Function | Content Tab | API Endpoint | Database Tables |
|-----------|------|---------|-------------|-------------|--------------|-----------------|
| Pengguna | users | `users` | `selectMenu('users')` | `#usersTab` | N/A (frontend only) | — |
| Pengaturan | settings | `settings` | `selectMenu('settings')` | `#settingsTab` | N/A (frontend only) | — |

---

## 3. User Sidebar Menu Map

### 3.1 Dasbor Saya Section

| Menu Item | Icon | Page ID | JS Function | Content Tab | API Endpoint | Database Tables |
|-----------|------|---------|-------------|-------------|--------------|-----------------|
| Dasbor Saya | layout-dashboard | `mydashboard` | `selectMenu('mydashboard')` | `#mydashboardTab` | `GET /v3-dashboard` | `users`, `outlets` |

### 3.2 Tugas Section

| Menu Item | Icon | Page ID | JS Function | Content Tab | API Endpoint | Database Tables |
|-----------|------|---------|-------------|-------------|--------------|-----------------|
| Tugas SO | clipboard-list | `sotasks` | `selectMenu('sotasks')` | `#sotasksTab` | `GET /opname-perintah` | `stok_opname_session`, `stok_opname_perintah` |
| Riwayat Saya | history | `sohistory` | `selectMenu('sohistory')` | `#sohistoryTab` | `GET /opname-history` | `stok_opname_session` |

### 3.3 Akun Section

| Menu Item | Icon | Page ID | JS Function | Content Tab | API Endpoint | Database Tables |
|-----------|------|---------|-------------|-------------|--------------|-----------------|
| Profil | user | `profile` | `selectMenu('profile')` | `#profileTab` | N/A (frontend only) | — |

---

## 4. Valid Menus List

```javascript
const VALID_MENUS = [
  "dashboard",     // Admin dashboard
  "admin",         // Admin panel (alias for dashboard)
  "penjualan",     // Sales monitoring
  "persediaan",    // Inventory overview
  "forecast",      // Sales forecasting
  "opname",        // Stock opname
  "taskcenter",    // Task center (not in sidebar)
  "approvalcenter",// Approval center (not in sidebar)
  "activity",      // Activity timeline (not in sidebar)
  "audit",         // Audit stok outlet (not in sidebar)
  "reports"        // Reports (not in sidebar)
];
```

---

## 5. Page to API Endpoint Mapping

### 5.1 Dashboard Page

| Component | API Endpoint | Method | Database Tables |
|-----------|---------------|--------|------------------|
| KPI Cards | `/kpi` | GET | `penjualan`, `produk`, `outlets` |
| Chart | `/chart` | GET | `penjualan` |
| Top Produk | `/top-produk` | GET | `produk`, `penjualan_detail` |
| Top Outlet | `/top-outlet` | GET | `outlets`, `penjualan` |
| Outlet Status | `/outlet-status` | GET | `outlets` |
| Mini Review | `/mini-review` | GET | Various |
| V3 Dashboard | `/v3-dashboard` | GET | All tables |

### 5.2 Penjualan Page

| Component | API Endpoint | Method | Database Tables |
|-----------|---------------|--------|------------------|
| Sales Chart | `/v3-chart` | GET | `penjualan` |
| Sales List | `/v3-penjualan` | GET | `penjualan`, `penjualan_detail` |
| Add Sale | `/add-penjualan` | POST | `penjualan`, `penjualan_detail` |
| Import Sales | `/import-penjualan` | POST | `penjualan`, `penjualan_detail` |
| Template | `/template-penjualan` | GET | (Excel template) |

### 5.3 Persediaan Page

| Component | API Endpoint | Method | Database Tables |
|-----------|---------------|--------|------------------|
| Stock List | `/v3-persediaan` | GET | `produk`, `stok_mutasi` |
| Stock System | `/stok-sistem` | GET | `stok_mutasi` |
| Produk List | `/produk-list` | GET | `produk`, `kategori` |

### 5.4 Opname Page

| Component | API Endpoint | Method | Database Tables |
|-----------|---------------|--------|------------------|
| Opname List | `/v3-opname` | GET | `stok_opname_session` |
| Create Opname | `/v3-opname` | POST | `stok_opname_session`, `stok_opname_detail` |
| Update Opname | `/v3-opname` | PUT | `stok_opname_session`, `stok_opname_detail` |
| Opname Detail | `/v3-opname-detail` | GET/POST | `stok_opname_detail` |
| Opname Commands | `/opname-perintah` | GET/POST | `stok_opname_perintah` |
| Opname Export | `/opname-export` | GET | `stok_opname_session` |
| Save Opname | `/simpan-opname` | POST | `stok_opname_session` |
| Adjust Opname | `/sesuaikan-opname` | POST | `stok_opname_detail` |
| Opname History | `/opname-history` | GET | `stok_opname_session` |

### 5.5 Forecast Page

| Component | API Endpoint | Method | Database Tables |
|-----------|---------------|--------|------------------|
| Forecast Data | `/forecast` | GET | `penjualan`, `produk` |

### 5.6 Audit Page

| Component | API Endpoint | Method | Database Tables |
|-----------|---------------|--------|------------------|
| Audit Data | `/audit` | GET | `outlets`, `penjualan`, `stok_opname_session` |

### 5.7 Outlet Management

| Component | API Endpoint | Method | Database Tables |
|-----------|---------------|--------|------------------|
| Outlet List | `/outlet-list` | GET | `outlets` |
| Outlet Transactions | `/outlet-transaksi` | GET | `outlets`, `penjualan` |
| Add Outlet | `/add-outlet` | POST | `outlets` |
| Import Outlet | `/import-outlet` | POST | `outlets` |
| Template | `/template-outlet` | GET | (Excel template) |

---

## 6. JavaScript File Responsibilities

### 6.1 Core Files

| File | Size | Responsibility | Routes Handled |
|------|------|----------------|-----------------|
| `js/dashboard.js` | 206KB | Main SPA logic, menu routing, data loading | All `data-menu` items |
| `js/router.js` | 29KB | Alternative router (V3-style) | `/dashboard`, `/users`, `/settings`, `/sales`, `/inventory`, `/forecast`, `/stock-opname` |
| `js/sidebar-ui.js` | 6.7KB | Sidebar interactions | Sidebar toggle, mobile menu |
| `js/dashboard-opname-perintah.js` | 31KB | Opname command workflow | Opname tasks |
| `js/user-management.js` | 24KB | User CRUD UI | Users management |

### 6.2 Backend Route Handlers

| File | API Routes | Purpose |
|------|-----------|---------|
| `backend/auth.js` | `/v1/auth/login*`, `/v1/auth/logout` | Authentication |
| `backend/kpi.js` | `/kpi` | KPI calculations |
| `backend/chart.js` | `/chart` | Chart data |
| `backend/v3-dashboard.js` | `/v3-dashboard` | V3 dashboard data |
| `backend/v3-penjualan.js` | `/v3-penjualan` | V3 sales |
| `backend/v3-persediaan.js` | `/v3-persediaan` | V3 inventory |
| `backend/v3-opname.js` | `/v3-opname` | V3 stock opname |
| `backend/v3-opname-detail.js` | `/v3-opname-detail` | V3 opname details |
| `backend/v3-chart.js` | `/v3-chart` | V3 chart data |
| `backend/forecast.js` | `/forecast` | Sales forecasting |
| `backend/audit.js` | `/audit` | Audit trail |
| `backend/opname-perintah.js` | `/opname-perintah` | Opname commands |
| `backend/opname-history.js` | `/opname-history` | Opname history |
| `backend/import-*.js` | `/import-*` | Import handlers |
| `backend/add-*.js` | `/add-*` | Add/CRUD handlers |

---

## 7. Database Tables by Feature

### 7.1 Authentication

| Table | Purpose | Related API |
|-------|---------|-------------|
| `users` | User accounts, roles | `/v1/auth/login*` |
| `user_sessions` | Session tracking | `/v1/auth/logout` |

### 7.2 Master Data

| Table | Purpose | Related API |
|-------|---------|-------------|
| `kategori` | Product categories | All |
| `supplier` | Suppliers | All |
| `outlets` | Outlet/location data | `/outlet-*`, `/add-outlet` |
| `produk` | Products | `/produk-*`, `/v3-persediaan` |

### 7.3 Warehouse Structure

| Table | Purpose | Related API |
|-------|---------|-------------|
| `rak` | Warehouse racks | Opname related |
| `rak_capacity_log` | Rack capacity tracking | Opname related |

### 7.4 Inventory

| Table | Purpose | Related API |
|-------|---------|-------------|
| `stok_mutasi` | Stock mutations | `/stok-sistem`, `/v3-persediaan` |
| `stok_real_time` | Real-time stock | `/v3-persediaan` |
| `lokasi_barang` | Product locations | Opname related |

### 7.5 Sales/Purchase

| Table | Purpose | Related API |
|-------|---------|-------------|
| `penjualan` | Sales transactions | `/v3-penjualan`, `/add-penjualan` |
| `penjualan_detail` | Sales line items | `/v3-penjualan`, `/add-penjualan` |
| `pembelian` | Purchase transactions | `/add-pembelian` |
| `pembelian_detail` | Purchase line items | `/add-pembelian` |

### 7.6 Stock Opname

| Table | Purpose | Related API |
|-------|---------|-------------|
| `stok_opname_session` | Opname sessions | `/v3-opname` |
| `stok_opname_detail` | Opname items | `/v3-opname-detail` |
| `stok_opname_perintah` | Opname commands | `/opname-perintah` |
| `stok_opname_adjustment` | Adjustments | `/sesuaikan-opname` |
| `selisih_analisis` | Difference analysis | `/sesuaikan-opname` |

### 7.7 Scanning

| Table | Purpose | Related API |
|-------|---------|-------------|
| `transaksi_scan` | Scan transactions | — |

### 7.8 Notifications

| Table | Purpose | Related API |
|-------|---------|-------------|
| `notifikasi` | User notifications | — |
| `notifikasi_config` | Notification settings | — |

### 7.9 Audit & Reporting

| Table | Purpose | Related API |
|-------|---------|-------------|
| `audit_log` | Audit trail | `/audit` |
| `laporan_stok` | Stock reports | — |

---

## 8. Missing/Empty Pages

### 8.1 Pages Defined in Code But Not in Sidebar

| Page ID | Status | Notes |
|---------|--------|-------|
| `taskcenter` | ⚠️ Hidden | Has tab `#taskcenterTab` but no sidebar menu |
| `approvalcenter` | ⚠️ Hidden | Has tab `#approvalcenterTab` but no sidebar menu |
| `activity` | ⚠️ Hidden | Has tab `#activityTab` but no sidebar menu |
| `audit` | ⚠️ Hidden | Has tab `#auditTab` but no sidebar menu |
| `reports` | ⚠️ Hidden | Has tab `#reportsTab` but no sidebar menu |
| `mydashboard` | ✅ User Sidebar | Available in user sidebar |
| `sotasks` | ✅ User Sidebar | Available in user sidebar |
| `sohistory` | ✅ User Sidebar | Available in user sidebar |
| `profile` | ✅ User Sidebar | Available in user sidebar |

### 8.2 Pages in router.js But Not in Sidebar

| Route | Status | Notes |
|-------|--------|-------|
| `/sales` | ⚠️ Not Used | Defined in router.js but selectMenu uses different IDs |
| `/inventory` | ⚠️ Not Used | Defined in router.js but selectMenu uses different IDs |
| `/stock-opname` | ⚠️ Not Used | Alternative route for opname |

---

## 9. Navigation Inconsistencies

| Issue | Description |
|-------|-------------|
| **Dual Routing** | router.js uses path-based routing (`/dashboard`), dashboard.js uses query-based (`data-menu="dashboard"`) |
| **Missing Sidebar Items** | 5 pages exist in code but not in sidebar (taskcenter, approvalcenter, activity, audit, reports) |
| **User Sidebar Limited** | User role has only 4 menu items vs admin with 4 items - but code supports more |
| **Persediaan Not in Admin Sidebar** | `persediaan` is a valid menu but not shown in admin sidebar |
| **Forecast Not in Admin Sidebar** | `forecast` is a valid menu but not shown in admin sidebar |

---

## 10. Content Tab Mapping

| Tab ID | Displayed By | Content |
|--------|--------------|---------|
| `#adminTab` | `menu === "dashboard" \|\| menu === "admin"` | Admin dashboard with KPI, charts |
| `#kpiTab` | `menu === "penjualan"` | Sales KPIs and chart |
| `#persediaanTab` | `menu === "persediaan"` | Inventory overview |
| `#forecastTab` | `menu === "forecast"` | Sales forecasting |
| `#opnameTab` | `menu === "opname" && role === 'admin'` | Full opname interface |
| `#operatorTab` | `menu === "opname" && role !== 'admin'` | Operator opname view |
| `#usersTab` | `menu === "users"` | User management |
| `#settingsTab` | `menu === "settings"` | Settings page |
| `#taskcenterTab` | `menu === "taskcenter"` | Task center (hidden) |
| `#approvalcenterTab` | `menu === "approvalcenter"` | Approval center (hidden) |
| `#activityTab` | `menu === "activity"` | Activity timeline (hidden) |
| `#auditTab` | `menu === "audit"` | Audit stok outlet (hidden) |
| `#reportsTab` | `menu === "reports"` | Reports (hidden) |

---

*Document generated by project audit*  
*Last updated: 2026-06-10*