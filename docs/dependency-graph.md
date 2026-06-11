# CV EPIC Warehouse - Dependency Graph

**Document Version:** 1.0.0  
**Audit Date:** 2026-06-10  
**Purpose:** Document the complete dependency flow from index.html to database

---

## 1. High-Level Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        index.html                                 │   │
│  │  ├── CSS: design-system.css, style.css                          │   │
│  │  ├── JS: dashboard.js, sidebar-ui.js, user-management.js        │   │
│  │  └── Lucide Icons                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        js/router.js                             │   │
│  │  └── SPA Router (path-based routing)                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     js/dashboard.js                              │   │
│  │  ├── selectMenu() - Main menu handler                           │   │
│  │  ├── loadData() - Data fetching                                │   │
│  │  └── initPage() - Page initialization                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│           ┌────────────────────────┼────────────────────────┐          │
│           │                        │                        │          │
│           ▼                        ▼                        ▼          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │
│  │  Auth Flow      │    │  Data Loading    │    │  UI Updates     │    │
│  │  performLogin() │    │  fetch('/api/*') │    │  renderPage()   │    │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘    │
└───────────┼───────────────────────┼───────────────────────┼─────────────┘
            │                       │                       │
            │    HTTP Request       │                       │
            ▼                       ▼                       │
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVER (Vercel/Node.js)                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        server.js                                 │   │
│  │  ├── Static file serving (css/, js/, assets/)                   │   │
│  │  └── API routing (all /api/* routes)                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      api/index.js                                │   │
│  │  └── Route dispatcher (38 routes)                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│           ┌────────────────────────┼────────────────────────┐          │
│           │                        │                        │          │
│           ▼                        ▼                        ▼          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │
│  │  Auth Module    │    │  Data Handlers   │    │  CRUD Handlers  │    │
│  │  backend/auth.js│    │  backend/*.js    │    │  backend/add-*.js│   │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘    │
└───────────┼───────────────────────┼───────────────────────┼─────────────┘
            │                       │                       │
            │    Database Query     │                       │
            ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE (PostgreSQL)                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       services/db.js                             │   │
│  │  └── PostgreSQL Connection Pool (pg library)                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Database Tables                             │   │
│  │  ├── users, outlets, produk, kategori, supplier                  │   │
│  │  ├── penjualan, pembelian, stok_mutasi                         │   │
│  │  └── stok_opname_session, stok_opname_detail                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Entry Point Dependency Chain

### 2.1 index.html → Full Dependency Tree

```
index.html (Root entry point)
│
├── CSS Dependencies
│   ├── /css/design-system.css
│   │   └── Variables, typography, buttons, cards
│   ├── /css/style.css (164KB - main styles)
│   │   ├── Layout styles
│   │   ├── Table styles
│   │   ├── Form styles
│   │   └── Component styles
│   └── /css/layout.css, /css/sidebar.css, /css/table.css (duplicates)
│
├── JavaScript Dependencies (loaded in order)
│   ├── https://unpkg.com/lucide@latest (CDN icon library)
│   ├── /js/sidebar-ui.js (6.7KB)
│   │   └── toggleMobileMenu(), updateSidebarState()
│   ├── /js/dashboard.js (206KB - MAIN)
│   │   ├── Auth functions: performLogin(), performLogout(), getStoredAuth()
│   │   ├── Menu routing: selectMenu(), getAllowedMenus(), canAccessMenu()
│   │   ├── Data loading: loadData(), loadKpi(), loadChart(), loadOpname()
│   │   ├── UI updates: updatePageHeader(), renderPage(), showToast()
│   │   └── Page modules: initAdminDashboard(), initSalesTab(), etc.
│   ├── /js/dashboard-opname-perintah.js (31KB)
│   │   └── Opname command workflow, loadPerintahList(), submitPerintah()
│   └── /js/user-management.js (24KB)
│       └── User CRUD UI, loadUsers(), saveUser(), deleteUser()
│
└── Inline JavaScript
    ├── Auth state management
    ├── Login mode switching (user/admin)
    └── Lucide icon initialization
```

### 2.2 Alternative Entry Points

```
index-v3.html (Alternative V3 layout - NOT USED)
index-refactored.html (Refactored version - NOT USED)
public/index.html (Duplicate - NOT USED)
```

These files are loaded but not actively served as entry points.

---

## 3. Router Dependency Chain

### 3.1 js/router.js (Alternative Router)

```
router.js (V3-style path-based router)
│
├── Routes Definition
│   └── {
│       '/dashboard': 'Dashboard',
│       '/users': 'Users',
│       '/settings': 'Settings',
│       '/sales': 'Sales',
│       '/inventory': 'Inventory',
│       '/forecast': 'Forecast',
│       '/stock-opname': 'StockOpname'
│     }
│
├── Navigation
│   ├── navigate(path) → handleRoute()
│   ├── popstate event listener
│   └── click handler for [data-route] elements
│
├── Page Loading
│   ├── loadPage(pageName)
│   ├── getPageHTML(pageName) → HTML templates
│   └── initPageScripts(pageName)
│
└── Page Templates (inline)
    ├── getDashboardHTML()
    ├── getUsersHTML()
    ├── getSettingsHTML()
    ├── getSalesHTML()
    ├── getInventoryHTML()
    ├── getForecastHTML()
    └── getStockOpnameHTML()
```

### 3.2 js/dashboard.js (Primary Router)

```
dashboard.js (Query-based menu router - PRIMARY)
│
├── Auth State
│   ├── getStoredAuth() → localStorage
│   ├── getCurrentUserRole() → localStorage
│   └── applyAuthState() → UI update
│
├── Menu Validation
│   ├── VALID_MENUS = [...]
│   ├── getAllowedMenus() → based on role
│   ├── canAccessMenu(menu) → permission check
│   └── getDefaultMenuForRole() → role-based default
│
├── Menu Handler: selectMenu(event, menu)
│   ├── Switch statement for each menu
│   ├── Shows/hides content tabs
│   └── Calls load functions
│
└── Tab Content Loading
    ├── #adminTab → loadAdminDashboard()
    ├── #kpiTab → loadData()
    ├── #persediaanTab → loadPersediaan()
    ├── #forecastTab → loadForecast()
    ├── #opnameTab → loadOpnameKpiData(), loadPerintahList()
    └── #operatorTab → loadOperatorDashboard()
```

---

## 4. API Call Dependency Chain

### 4.1 Authentication Flow

```
performLogin() [dashboard.js]
    │
    ▼
POST /api/v1/auth/login/user  OR  /api/v1/auth/login/admin
    │
    ├── backend/auth.js
    │   └── login(req, res, portal)
    │
    ▼
services/db.js (PostgreSQL pool)
    │
    ▼
SELECT FROM users WHERE username = $1
    │
    ▼
Response: { access_token, refresh_token, user data }
    │
    ▼
localStorage.setItem('auth_user', JSON.stringify(data))
    │
    ▼
applyAuthState() → UI update
```

### 4.2 Data Loading Flow

```
loadData() [dashboard.js]
    │
    ├── GET /api/kpi
    │   └── backend/kpi.js
    │       └── services/db.js → SELECT KPI data
    │
    ├── GET /api/chart
    │   └── backend/chart.js
    │       └── services/db.js → SELECT monthly sales
    │
    ├── GET /api/v3-dashboard
    │   └── backend/v3-dashboard.js
    │       └── services/db.js → SELECT dashboard aggregates
    │
    └── GET /api/outlet-status
        └── backend/outlet-status.js
            └── services/db.js → SELECT outlet status
```

### 4.3 Opname Flow

```
selectMenu('opname') [dashboard.js]
    │
    ▼
loadOpnameKpiData()
    │
    ├── GET /api/v3-opname
    │   └── backend/v3-opname.js → List sessions
    │
    └── GET /api/opname-perintah
        └── backend/opname-perintah.js → List commands
    │
    ▼
loadPerintahList() [dashboard-opname-perintah.js]
    │
    ▼
User creates new opname command
    │
    ▼
POST /api/opname-perintah
    │
    ▼
User inputs physical stock
    │
    ▼
POST /api/simpan-opname
    │
    ▼
POST /api/sesuaikan-opname (adjust differences)
```

---

## 5. Backend Handler Dependencies

### 5.1 Handler → Database Table Mapping

```
api/index.js (Route dispatcher)
    │
    ├── auth.js → users, user_sessions
    ├── kpi.js → penjualan, produk, outlets
    ├── chart.js → penjualan
    ├── v3-dashboard.js → multiple tables
    ├── v3-penjualan.js → penjualan, penjualan_detail
    ├── v3-persediaan.js → produk, stok_mutasi
    ├── v3-opname.js → stok_opname_session
    ├── v3-opname-detail.js → stok_opname_detail
    ├── v3-chart.js → penjualan
    ├── forecast.js → penjualan, produk
    ├── audit.js → outlets, penjualan
    ├── opname-perintah.js → stok_opname_perintah
    ├── opname-history.js → stok_opname_session
    ├── persediaan.js → produk, stok_mutasi
    ├── import-penjualan.js → penjualan, penjualan_detail
    ├── import-pembelian.js → pembelian, pembelian_detail
    ├── import-outlet.js → outlets
    ├── add-penjualan.js → penjualan, penjualan_detail
    ├── add-pembelian.js → pembelian, pembelian_detail
    ├── add-outlet.js → outlets
    ├── simpan-opname.js → stok_opname_session, detail
    ├── sesuaikan-opname.js → stok_opname_detail
    └── stok-opname-export.js → stok_opname_session
```

### 5.2 Services Layer

```
services/db.js (PostgreSQL Connection Pool)
    │
    ├── new Pool({ connectionString, ssl, max: 3 })
    ├── Global singleton pattern
    └── Query methods: pool.query()
```

---

## 6. Database Schema Dependencies

### 6.1 Table Relationships

```
users (1)──────────────< user_sessions
  │
  ├── (FK) outlets.manager_id > outlets (1)
  │
  └── (FK) stok_opname_session.checker_id > users (M)
      │
      └── (FK) stok_opname_session.approver_id > users

kategori (1)────────────< produk (N)
supplier (1)────────────< produk (N)
outlets (1)──────────────< rak (N)
outlets (1)──────────────< stok_mutasi (N)
outlets (1)──────────────< stok_opname_session (N)
outlets (1)──────────────< laporan_stok (N)
outlets (1)──────────────< notifikasi_config (N)

rak (1)─────────────────< rak_capacity_log (N)
rak (1)─────────────────< lokasi_barang (N)
rak (1)─────────────────< stok_opname_detail (N, nullable)

produk (1)──────────────< lokasi_barang (N)
produk (1)──────────────< stok_real_time (1)
produk (1)──────────────< stok_mutasi (N)
produk (1)──────────────< penjualan_detail (N)
produk (1)──────────────< pembelian_detail (N)
produk (1)──────────────< stok_opname_detail (N)

stok_opname_session (1)─< stok_opname_detail (N)
stok_opname_detail (1)──< stok_opname_adjustment (1)
stok_opname_detail (1)──< selisih_analisis (1)

users (1)───────────────< audit_log (N)
users (1)───────────────< notifikasi (N)
users (1)───────────────< transaksi_scan (N)
```

---

## 7. File Dependency Matrix

| File | Depends On | Used By |
|------|------------|---------|
| `index.html` | CSS files, JS files | Browser (entry point) |
| `server.js` | api/index.js | Vercel |
| `api/index.js` | backend/*.js, services/db.js | server.js |
| `backend/*.js` | services/db.js | api/index.js |
| `services/db.js` | PostgreSQL | backend/*.js |
| `js/dashboard.js` | js/sidebar-ui.js | index.html |
| `js/router.js` | — | Alternative entry |
| `flask_app/` | config.py | LEGACY - unused |

---

## 8. Module Dependency Diagram

```
                    ┌─────────────────┐
                    │   index.html    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐        ┌─────────┐        ┌─────────┐
    │  CSS    │        │  Icons  │        │   JS    │
    │ (Lucide)│        │ (CDN)   │        │ (Files) │
    └─────────┘        └─────────┘        └────┬────┘
                                               │
                           ┌───────────────────┼───────────────────┐
                           │                   │                   │
                           ▼                   ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │  sidebar-   │     │  dashboard  │     │    user-    │
                    │    ui.js    │     │    .js      │     │ management.js
                    └─────────────┘     └──────┬──────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
             ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
             │  Auth Flow  │          │ Data Loader │          │  Tab Display│
             │ performLogin│          │   loadData  │          │ selectMenu  │
             └──────┬──────┘          └──────┬──────┘          └─────────────┘
                    │                         │
                    ▼                         ▼
             ┌─────────────────────────────────────────────┐
             │              api/index.js                   │
             │         (38 route definitions)              │
             └─────────────────────┬───────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
  │  auth.js    │           │ kpi.js      │           │ chart.js    │
  │  forecast.js│           │ v3-dash.js  │           │ opname.js   │
  │  audit.js   │           │ v3-*.js     │           │ import-*.js │
  └──────┬──────┘           └──────┬──────┘           └──────┬──────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │  services/db.js │
                           │  (PG Pool)      │
                           └────────┬────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │   PostgreSQL    │
                           │   (Neon)        │
                           └─────────────────┘
```

---

## 9. Circular Dependency Risks

### 9.1 Potential Issues

| Pattern | Risk Level | Description |
|---------|------------|-------------|
| `index.html` loads `dashboard.js` | Low | One-way dependency |
| `dashboard.js` has inline auth | Low | Self-contained |
| `services/db.js` uses global singleton | Low | Standard pattern |
| `flask_app/` imports `config.py` | ⚠️ Legacy | No active usage |

### 9.2 No Circular Dependencies Detected

The current architecture does not have circular dependencies as:
- Frontend files are loaded synchronously
- Backend handlers are pure functions
- Database service is a singleton

---

## 10. Import/Export Dependencies

### 10.1 ES Module Imports

```javascript
// api/index.js
import authHandler from "../backend/auth.js";
import kpiHandler from "../backend/kpi.js";
// ... 30+ imports

// backend/auth.js
import crypto from "crypto";
import pool from "../services/db.js";

// services/db.js
import { Pool } from "pg";
```

### 10.2 Python Flask (Legacy)

```python
# app.py
from flask import Flask
from flask_app.models import db

# flask_app/__init__.py
from flask_app.models import db
```

---

*Document generated by project audit*  
*Last updated: 2026-06-10*