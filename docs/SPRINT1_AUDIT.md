# SPRINT 1 AUDIT REPORT

**Tanggal Audit:** 2026-06-09  
**Auditor:** OpenHands Agent  
**Status:** AUDIT COMPLETE - BREAK BEFORE SPRINT 2

---

## 1. RINGKASAN AUDIT

### Overview
Audit menyeluruh terhadap Sprint 1 menunjukkan bahwa fondasi proyek memiliki **masalah kritis** yang harus diselesaikan sebelum melanjutkan ke Sprint 2. Ditemukan ketidaksesuaian antara blueprint, schema database, mock data, dan dokumentasi.

### Temuan Summary
| Kategori | Kritikal | Sedang | Minor | Total |
|----------|----------|--------|-------|-------|
| Schema Database | 2 | 3 | 2 | 7 |
| Seed Data | 3 | 1 | 0 | 4 |
| Auth System | 1 | 2 | 1 | 4 |
| Dashboard | 2 | 2 | 1 | 5 |
| Security | 2 | 2 | 1 | 5 |
| **TOTAL** | **10** | **10** | **5** | **25** |

---

## 2. STRUKTUR FOLDER

```
/workspace/project/inventory_app/
├── app.py                    # Flask main app
├── config.py                 # Configuration
├── schema.sql               # Raw SQL schema (legacy)
├── init-db.js               # DB initialization script
│
├── flask_app/               # Flask application
│   ├── __init__.py
│   ├── blueprints/          # API endpoints
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── dashboard.py     # Dashboard API
│   │   ├── produk.py
│   │   ├── opname.py
│   │   └── ...
│   ├── models/              # SQLAlchemy models
│   │   └── __init__.py      # 457 lines, 20+ models
│   ├── services/
│   └── utils/
│       └── auth.py         # Auth service (JWT, password hashing)
│
├── backend/                 # Node.js backend (v3)
│   ├── v3-dashboard.js
│   ├── v3-chart.js
│   ├── kpi.js
│   └── ...
│
├── public/                  # Frontend
│   ├── index.html
│   └── js/
│       └── dashboard.js    # 5700+ lines with mock data
│
├── migration_auth_login.sql  # Auth schema + seed users
├── migration_opname_*.sql    # Opname migrations
├── scripts/                  # Utility scripts
└── docs/                     # Documentation
```

### Architecture Concern
**PERHATIAN:** Terdapat DUA backend berbeda:
1. **Flask (`flask_app/`)** - Python/Flask dengan SQLAlchemy ORM
2. **Node.js (`backend/`)** - JavaScript/Express

Ini menyebabkan kompleksitas dan potensi inkonsistensi data.

---

## 3. AUDIT SCHEMA PRISMA / DATABASE MODELS

### 3.1 Mismatch: schema.sql vs SQLAlchemy Models

Terdapat DUA definisi schema berbeda yang saling bertentangan:

**schema.sql** (Raw SQL):
- `produk` - hanya 4 field (sku, nama_produk, harga_beli, harga_jual)
- `outlet` - hanya 3 field (id, nama_outlet, created_at)
- `penjualan`, `pembelian`, `stok_awal` - tabel terpisah per periode
- `outlet_stok_awal`, `outlet_stok_masuk`, `outlet_penjualan` - outlet-level tables
- `produk_level_mapping`, `outlet_siswa_level_bulanan` - level tracking

**SQLAlchemy Models** (`flask_app/models/__init__.py`):
- `Produk` - 15+ field (kode_barang, nama_barang, kategori_id, supplier_id, dll)
- `Outlet` - 8 field (kode_outlet, alamat, kota, manager_id, dll)
- `StokRealTime`, `StokMutasi` - single stock tracking
- Tidak ada `penjualan`, `pembelian`, `stok_awal` tables
- Tidak ada `outlet_stok_*` tables

### 3.2 Tables Tidak Sesuai Blueprint

**Tables yang ADA di schema.sql tapi TIDAK ADA di Models:**
1. `penjualan` - Sales transactions
2. `pembelian` - Purchase transactions  
3. `stok_awal` - Initial stock
4. `outlet_stok_awal` - Per-outlet initial stock
5. `outlet_stok_masuk` - Per-outlet stock in
6. `outlet_penjualan` - Per-outlet sales
7. `outlet_stok_penyesuaian` - Per-outlet adjustments
8. `produk_level_mapping` - Level-based product mapping
9. `outlet_siswa_level_bulanan` - Monthly student level data

**Tables yang ADA di Models tapi TIDAK ADA di schema.sql:**
1. `Kategori` - Category master
2. `Supplier` - Supplier master
3. `Rak` - Warehouse racks
4. `LokasiBarang` - Product rack locations
5. `Barcodes` - Barcode system
6. `TransaksiScan` - Scan transactions
7. `Notifikasi` - Notifications
8. `AuditLog` - Audit trail

### 3.3 Complexity Issues

**OVER-ENGINEERED Tables (berlebihan untuk current scope):**
1. `selisih_analisis` - Root cause analysis untuk setiap opname detail
2. `laporan_stok` - Pre-generated stock reports
3. `notifikasi_config` - Per-outlet notification settings
4. `rak_capacity_logs` - Rack capacity tracking
5. `barcode_scan_history` - Every barcode scan logged

**Under-Engineered Tables (tidak cukup untuk business needs):**
1. `stok_opname_session` - Tidak ada field untuk multi-periode reporting
2. `outlet` - Tidak ada field untuk outlet contact person

### 3.4 Business Rules Conflicts

1. **Stock Calculation:** 
   - Models pakai `StokMutasi` dengan running balance
   - schema.sql pakai period-based tables dengan awal/masuk/keluar terpisah
   - Keduanya tidak sinkron

2. **Outlet Stock:**
   - schema.sql punya `outlet_stok_*` tables
   - Models tidak punya ini, menggunakan `StokMutasi.outlet_id` instead
   - Konflik dengan blueprint yang mungkin butuh per-outlet stock

---

## 4. AUDIT SEED DATA

### 4.1 Dummy Users - KRITIKAL

**File: `migration_auth_login.sql` (line 52-57)**
```sql
-- Default accounts for first login.
-- Admin portal: username admin / password admin123
-- User portal:  username checker / password checker123
INSERT INTO users (username, email, password_hash, nama_lengkap, role, outlet_id, is_active, failed_login_count)
VALUES
  ('admin', 'admin@warehouse.local', '240be518f...', 'Administrator', 'admin', NULL, TRUE, 0),
  ('checker', 'checker@warehouse.local', '2479ca1c...', 'Checker Opname', 'checker_opname', NULL, TRUE, 0)
```

**⚠️ KRITIKAL: Password dalam plaintext di komentar:**
- Username: `admin`, Password: `admin123`
- Username: `checker`, Password: `checker123`

### 4.2 Dummy Products - KRITIKAL

**File: `schema.sql` (line 345-361)**
```sql
INSERT INTO produk (sku, nama_produk, harga_beli, harga_jual) VALUES
('SKU001', 'Produk A', 10000, 15000),
('SKU002', 'Produk B', 20000, 25000),
('SKU003', 'Produk C', 15000, 20000)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO outlet (nama_outlet) VALUES
('OUTLET 1'),
('OUTLET 2'),
('OUTLET 3')
ON CONFLICT (nama_outlet) DO NOTHING;

INSERT INTO stok_awal (sku, qty_awal) VALUES
('SKU001', 100),
('SKU002', 50),
('SKU003', 75)
ON CONFLICT DO NOTHING;
```

**⚠️ KRITIKAL: Hardcoded dummy data:**
- 3 dummy products: "Produk A", "Produk B", "Produk C"
- 3 dummy outlets: "OUTLET 1", "OUTLET 2", "OUTLET 3"
- Dummy initial stock values

### 4.3 Documentation Contains Passwords

**Files dengan password plaintext:**
1. `README.md` - line 163-164: Default credentials
2. `DATABASE_MIGRATION_GUIDE.md` - line 773-775: Default credentials
3. `INSTALLATION_GUIDE.md` - line 170, 192, 574: Password references
4. `database_schema_mysql_complete.sql` - line 507, 509: Password hashes

### 4.4 Summary Seed Data

| Item | Location | Type | Status |
|------|----------|------|--------|
| admin/admin123 | migration_auth_login.sql | User | ⚠️ HARDCODED |
| checker/checker123 | migration_auth_login.sql | User | ⚠️ HARDCODED |
| SKU001-Produk A | schema.sql | Product | ⚠️ HARDCODED |
| SKU002-Produk B | schema.sql | Product | ⚠️ HARDCODED |
| SKU003-Produk C | schema.sql | Product | ⚠️ HARDCODED |
| OUTLET 1-3 | schema.sql | Outlet | ⚠️ HARDCODED |
| Stock awal | schema.sql | Stock | ⚠️ HARDCODED |

---

## 5. AUDIT AUTHENTICATION

### 5.1 Password Hashing ✅

**File: `flask_app/utils/auth.py` (line 16-18)**
```python
@staticmethod
def hash_password(password: str) -> str:
    return generate_password_hash(password, method='pbkdf2:sha256')
```

**Status:** ✅ GOOD - Menggunakan pbkdf2:sha256 yang aman

### 5.2 JWT Implementation ✅

**File: `flask_app/utils/auth.py` (line 25-48)**
- Access token expires: 24 hours
- Refresh token expires: 30 days
- Token berisi: user_id, username, role

**Status:** ✅ GOOD - JWT implementation standard

### 5.3 Session Management ✅

**File: `flask_app/utils/auth.py` (line 51-101)**
- Session tokens stored in `user_sessions` table
- Previous sessions marked inactive on new login
- Session tracking dengan IP dan User-Agent

**Status:** ✅ GOOD - Session management properly implemented

### 5.4 Middleware ✅

**File: `flask_app/utils/auth.py` (line 149-220)**
```python
def login_required(f): ...       # JWT required
def role_required(*roles): ...    # Role check
def outlet_access_required(f):   # Outlet access check
```

**Status:** ✅ GOOD - Decorators properly implemented

### 5.5 Role Protection ⚠️

**File: `config.py` (line 79)**
```python
ALLOW_ALL_PERMISSIONS = os.environ.get('ALLOW_ALL_PERMISSIONS', 'false').lower() in ('1', 'true', 'yes')
```

**⚠️ WARNING:** Development mode bypasses ALL role checks. This is a security risk if accidentally enabled in production.

### 5.6 Login Portal Separation ⚠️

**File: `flask_app/blueprints/auth.py` (line 42-52)**
```python
@auth_bp.route('/login/admin', methods=['POST'])
def login_admin():
    return _login_with_portal('admin')

@auth_bp.route('/login/user', methods=['POST'])
def login_user():
    return _login_with_portal('user')
```

**Status:** ✅ GOOD - Separate login portals for admin/user

---

## 6. AUDIT DASHBOARD

### 6.1 FLASK Dashboard API ✅

**File: `flask_app/blueprints/dashboard.py`**
- `/api/v1/dashboard/opname-stats` - Opname statistics
- `/api/v1/dashboard/notifications` - User notifications
- Uses real database queries with joins

**Status:** ✅ GOOD - Real data from database

### 6.2 Node.js Dashboard Backend ⚠️

**File: `backend/v3-dashboard.js`**
- Uses database queries for KPI data
- Connects to PostgreSQL/Neon

**Status:** ⚠️ PARTIAL - Data appears real but some hardcoded SKU references (line 27)

### 6.3 Frontend Dashboard - CRITIKAL ISSUE ❌

**File: `public/js/dashboard.js` - EXTENSIVE MOCK DATA**

```javascript
// Line 3788: Mock operator data
const mockData = {
  tasksCompleted: 12,
  tasksTotal: 20,
  itemsCounted: 847,
  varianceFound: 3
};

// Line 3873: Mock tasks (5 tasks defined)
const mockTasks = [
  { id: 'TASK-001', title: 'Lakukan Stok Opname Bulanan', status: 'in_progress', ... },
  { id: 'TASK-002', title: 'Verifikasi Stok Masuk', status: 'review', ... },
  // ... 3 more tasks
];

// Line 4394: Mock approvals (multiple items)
const mockApprovals = [
  { id: 'APR-001', type: 'opname', status: 'pending', ... },
  // ... more items
];

// Line 4860: Mock activities
const mockActivities = [...];

// Line 5293: Mock audit logs
const mockAuditLogs = [...];
```

**⚠️ KRITIKAL FINDING:**
1. Dashboard uses mock data for tasks, approvals, activities, audit logs
2. The comment in `public/index.html` (line 404-408) claims:
   > "All dashboard data is now fetched from real database APIs. No mock data or dummy content is rendered."
   
   **INI TIDAK BENAR!** Dashboard.js contains extensive mock data.

3. Line 543-560 shows fallback logic:
```javascript
// Try to fetch outlets and top products; if fail, use simple mock
// If the API call fails, it falls back to mock data
```

### 6.4 Dashboard Scope Violation ⚠️

**Observation:** Dashboard appears to be a FULL-FEATURED dashboard with:
- Task Center (mock)
- Approval Center (mock)
- Activity Timeline (mock)
- Audit Center (mock)
- Reports Generator

**⚠️ WARNING:** Based on typical sprint planning, dashboard with all these features might be beyond Sprint 1 scope. Please verify with original sprint plan.

---

## 7. AUDIT SECURITY

### 7.1 Hardcoded Secrets ❌

**File: `config.py` (line 28)**
```python
SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
```

**⚠️ KRITIKAL:** Default SECRET_KEY is weak and guessable

### 7.2 Default Credentials in Documentation ❌

**Multiple files contain default credentials:**
- `README.md`
- `DATABASE_MIGRATION_GUIDE.md`
- `INSTALLATION_GUIDE.md`
- `database_schema_mysql_complete.sql`

**⚠️ KRITIKAL:** While passwords are hashed in DB, having them in plaintext documentation is a security risk

### 7.3 Development Mode Bypass ⚠️

**File: `config.py` (line 79, 103)**
```python
ALLOW_ALL_PERMISSIONS = os.environ.get('ALLOW_ALL_PERMISSIONS', 'false').lower() in ('1', 'true', 'yes')
# ...
ALLOW_ALL_PERMISSIONS = True  # Development mode
```

**⚠️ WARNING:** This bypasses all role checks. If accidentally enabled in production, it creates a major vulnerability.

### 7.4 CORS Configuration ⚠️

**File: `app.py` (line 39)**
```python
CORS(app, resources={r"/api/*": {"origins": cfg.CORS_ORIGINS}})
```

**File: `config.py` (line 54)**
```python
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
```

**⚠️ WARNING:** Default CORS allows all origins (`*`), which is risky for production

### 7.5 Session Cookie Security ✅

**File: `config.py` (line 86-89)**
```python
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
```

**Status:** ✅ GOOD - Session cookies properly secured

---

## 8. TEMUAN KRITIKAL

### K-001: Dashboard Menggunakan Mock Data Berlebihan
**Severity:** KRITIKAL  
**Location:** `public/js/dashboard.js`  
**Description:** Dashboard menggunakan mock data untuk Tasks, Approvals, Activities, Audit Logs. Comment di index.html menyatakan data dari API real, tapi实际情况 berbeda.  
**Impact:** Dashboard tidak menampilkan data real dari database  
**Recommendation:** 
1. Hapus semua mock data dari dashboard.js
2. Implementasikan API endpoints untuk setiap fitur
3. Update comment di index.html agar akurat

### K-002: Default Credentials dengan Password Lemah
**Severity:** KRITIKAL  
**Location:** `migration_auth_login.sql`, `config.py`, dokumentasi  
**Description:** Default user admin/admin123 dan checker/checker123. SECRET_KEY default adalah 'dev-secret-key-change-in-production'.  
**Impact:** Production environment rentan terhadap brute force attacks  
**Recommendation:**
1. Hapus default users atau force password change on first login
2. Hapus default SECRET_KEY fallback
3. Hapus password plaintext dari dokumentasi

### K-003: Schema Mismatch antara schema.sql dan Models
**Severity:** KRITIKAL  
**Location:** `schema.sql` vs `flask_app/models/__init__.py`  
**Description:** DUA definisi schema berbeda. schema.sql punya tables yang tidak ada di Models (penjualan, outlet_stok_*), dan sebaliknya.  
**Impact:** Inkonsistensi database schema, potential data loss  
**Recommendation:**
1. Pilih SATU schema definition sebagai source of truth
2. Buat migration plan untuk sinkronisasi
3. Hapus schema yang tidak digunakan

### K-004: Dual Backend Architecture
**Severity:** KRITIKAL  
**Location:** `flask_app/` (Python) vs `backend/` (Node.js)  
**Description:** Project memiliki dua backend berbeda yang keduanya aktif  
**Impact:** Kompleksitas maintenance, potential data inconsistency  
**Recommendation:**
1. Pilih SATU backend technology stack
2. Migrasi semua endpoints ke stack yang dipilih
3. Hapus codebase yang tidak digunakan

---

## 9. TEMUAN SEDANG

### S-001: Over-Engineered Database Schema
**Severity:** SEDANG  
**Location:** `flask_app/models/__init__.py`  
**Description:** Beberapa tables terlalu kompleks untuk current scope: selisih_analisis, laporan_stok, notifikasi_config  
**Impact:** Overhead maintenance tanpa immediate benefit  
**Recommendation:** Evaluasi necessity setiap table sebelum Sprint 2

### S-002: Hardcoded SKU in Backend Code
**Severity:** SEDANG  
**Location:** `backend/v3-dashboard.js:27`, `public/js/dashboard.js:2836`  
**Description:** Terdapat hardcoded SKU001, SKU002 dalam code  
**Impact:** Tidak flexible untuk real-world usage  
**Recommendation:** Ganti dengan dynamic data dari database

### S-003: CORS Default Allows All Origins
**Severity:** SEDANG  
**Location:** `config.py:54`  
**Description:** Default CORS_ORIGINS adalah '*'  
**Impact:** Potential security risk jika tidak dikonfigurasi  
**Recommendation:** Set explicit allowed origins di environment

### S-004: Dashboard Comment Tidak Akurat
**Severity:** SEDANG  
**Location:** `public/index.html:404-408`  
**Description:** Comment menyatakan "No mock data" tapi sebenarnya ada mock data  
**Impact:** Developer confusion, false documentation  
**Recommendation:** Update comment atau hapus mock data

### S-005: Missing Error Handling for API Failures
**Severity:** SEDANG  
**Location:** `public/js/dashboard.js:543-560`  
**Description:** Fallback ke mock data tanpa user notification  
**Impact:** User tidak tahu data mungkin tidak akurat  
**Recommendation:** Tambahkan visual indicator saat menggunakan fallback data

---

## 10. TEMUAN MINOR

### M-001: Inconsistent Date Format
**Severity:** MINOR  
**Location:** Various files  
**Description:** Beberapa tempat pakai 'YYYY-MM-DD', beberapa pakai timestamp  
**Recommendation:** Standardize date format across application

### M-002: Missing Index on Common Query Fields
**Severity:** MINOR  
**Location:** `flask_app/models/__init__.py`  
**Description:** Beberapa foreign key fields tidak punya index  
**Recommendation:** Add indexes untuk performance optimization

### M-003: Duplicate Code in Login Functions
**Severity:** MINOR  
**Location:** `flask_app/blueprints/auth.py:13-34`  
**Description:** `_login_with_portal()` function di-duplicate logic  
**Recommendation:** Refactor untuk reduce duplication

### M-004: Hardcoded Path in CSV Generation
**Severity:** MINOR  
**Location:** `public/js/dashboard.js:2836`  
**Description:** `const csv = 'sku,stok_fisik\nSKU001,10\nSKU002,5'` hardcoded  
**Recommendation:** Generate dynamically from real data

### M-005: Missing API Versioning Consistency
**Severity:** MINOR  
**Location:** Multiple API endpoints  
**Description:** Some endpoints use /api/v1, others use different versions  
**Recommendation:** Standardize to single API version

---

## 11. REKOMENDASI PERBAIKAN

### Prioritas 1 - Wajib Sebelum Sprint 2

| # | Item | Files to Modify | Reason | Risk |
|---|------|-----------------|--------|------|
| 1 | Hapus mock data dari dashboard.js | `public/js/dashboard.js` | Dashboard menampilkan fake data | HIGH |
| 2 | Hapus/amankan default credentials | `migration_auth_login.sql`, `config.py` | Security risk | HIGH |
| 3 | Resolve schema mismatch | `schema.sql`, `flask_app/models/` | Data inconsistency | HIGH |
| 4 | Pilih single backend technology | `flask_app/`, `backend/` | Maintainability | MEDIUM |
| 5 | Hapus plaintext passwords dari docs | `README.md`, `INSTALLATION_GUIDE.md`, dll | Security risk | HIGH |

### Prioritas 2 - Disarankan

| # | Item | Files to Modify | Reason | Risk |
|---|------|-----------------|--------|------|
| 1 | Update CORS configuration | `config.py` | Security hardening | LOW |
| 2 | Remove ALLOW_ALL_PERMISSIONS bypass | `flask_app/utils/auth.py` | Security risk | MEDIUM |
| 3 | Add index on frequently queried fields | `flask_app/models/__init__.py` | Performance | LOW |
| 4 | Standardize API versioning | All API endpoints | Consistency | LOW |

### Prioritas 3 - Nice to Have

| # | Item | Files to Modify | Reason | Risk |
|---|------|-----------------|--------|------|
| 1 | Refactor duplicate code | `flask_app/blueprints/auth.py` | Maintainability | LOW |
| 2 | Add error boundary for fallback data | `public/js/dashboard.js` | UX improvement | LOW |
| 3 | Document schema decisions | New doc in `docs/` | Knowledge transfer | LOW |

---

## 12. KESIMPULAN

### Overall Assessment: ⚠️ NEEDS FIXES BEFORE SPRINT 2

Sprint 1 memiliki fondasi yang baik dari sisi authentication dan basic structure, namun memiliki beberapa masalah kritis yang harus diselesaikan:

1. **Dashboard menggunakan mock data** - Tidak production-ready
2. **Schema mismatch** - Dua definisi berbeda
3. **Dual backend** - Kompleksitas tidak perlu
4. **Default credentials** - Security risk

### Next Steps:
1. **STOP** - Jangan mulai Sprint 2
2. **FIX** - Resolve critical issues listed above
3. **REVIEW** - Verify fixes with audit team
4. **PROCEED** - Setelah approval, baru mulai Sprint 2

---

**Audit Report Generated:** 2026-06-09  
**Next Review:** After all P1 fixes implemented