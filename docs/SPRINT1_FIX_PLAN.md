# SPRINT 1 FIX PLAN

**Tanggal:** 2026-06-09  
**Based on:** `docs/SPRINT1_AUDIT.md`  
**Status:** AWAITING APPROVAL

---

## OVERVIEW

Fix plan ini berdasarkan hasil audit Sprint 1. Semua item prioritas 1 WAJIB diselesaikan sebelum melanjutkan ke Sprint 2.

---

## DAFTAR FILE YANG PERLU DIPERBAIKI

### PRIORITAS 1 - KRITIKAL (Wajib Fix)

---

### 1. Dashboard Mock Data

**Files yang perlu diubah:**
- `public/js/dashboard.js`

**Daftar perubahan:**
1. Hapus `const mockData` (line ~3788)
2. Hapus `const mockTasks` array (line ~3873)
3. Hapus `const mockApprovals` array (line ~4394)
4. Hapus `const mockActivities` array (line ~4860)
5. Hapus `const mockAuditLogs` array (line ~5293)
6. Hapus fallback logic yang menggunakan mock (line ~543-560)
7. Update semua `renderTaskList()`, `renderApprovalList()`, dll untuk fetch dari API
8. Hapus hardcoded CSV dengan SKU (line ~2836)

**Alasan perbaikan:**
Dashboard menampilkan data palsu yang tidak mencerminkan real data dari database. User melihat KPI dan statistik yang tidak akurat.

**Prioritas:** HIGH  
**Estimasi risiko:** MEDIUM - Perubahannya cukup besar, perlu testing menyeluruh

---

### 2. Default Credentials & Secrets

**Files yang perlu diubah:**
- `migration_auth_login.sql`
- `config.py`
- `docs/README.md`
- `docs/DATABASE_MIGRATION_GUIDE.md`
- `docs/INSTALLATION_GUIDE.md`
- `database_schema_mysql_complete.sql`

**Daftar perubahan:**
1. **migration_auth_login.sql:**
   - Hapus comment dengan plaintext password (line 52-53)
   - Ganti dengan placeholder atau hapus sama sekali
   - Set password_hash ke NULL atau random hash, bukan hashed dari weak password

2. **config.py:**
   - Hapus fallback default SECRET_KEY
   - Buat aplikasi gagal startup jika SECRET_KEY tidak di-set di production
   ```python
   if os.environ.get('FLASK_ENV') == 'production' and not os.environ.get('SECRET_KEY'):
       raise ValueError('SECRET_KEY must be set in production')
   ```

3. **Dokumentasi:**
   - Hapus semua referensi ke admin123, checker123, test123
   - Ganti dengan instruksi untuk membuat credentials saat setup
   - Jangan pernah menampilkan password dalam dokumentasi

**Alasan perbaikan:**
- Default credentials adalah vector serangan utama
- Password lemah mudah di-brute force
- Dokumentasi dengan password adalah security incident waiting to happen

**Prioritas:** HIGH  
**Estimasi risiko:** HIGH - Jika tidak hati-hati bisa lock out semua user

---

### 3. Schema Mismatch Resolution

**Files yang perlu diubah:**
- `schema.sql`
- `flask_app/models/__init__.py`
- Migration files

**Pilihan pendekatan:**

**Option A: Gunakan schema.sql sebagai source of truth**
- Hapus SQLAlchemy models yang tidak ada di schema.sql
- Tambah models yang ada di schema.sql tapi belum di models (penjualan, outlet_stok_*, dll)
- Update semua API untuk menggunakan schema.sql tables

**Option B: Gunakan SQLAlchemy Models sebagai source of truth**
- Hapus schema.sql (legacy file)
- Buat migration untuk sync schema.sql dengan Models
- Update semua API untuk menggunakan Models

**Pilihan yang direkomendasikan:** Option B (SQLAlchemy Models)
- Models lebih maintainable
- Bisa generate migrations otomatis
- Type safety dengan Python

**Daftar perubahan (Option B):**
1. Hapus `schema.sql` atau rename ke `schema.legacy.sql`
2. Tambah missing models:
   - `Penjualan`
   - `Pembelian`
   - `StokAwal`
   - `OutletStokAwals`, `OutletStokMasuk`, `OutletPenjualan`
   - `ProdukLevelMapping`
   - `OutletSiswaLevelBulanan`
3. Hapus duplicate/over-engineered models:
   - `SelisihAnalisis` (jika tidak digunakan)
   - `LaporanStok` (bisa di-generate on-demand)
   - `NotifikasiConfig` (bisa simplify)
4. Update foreign key relationships
5. Buat SQL migration untuk sync database

**Alasan perbaikan:**
Schema mismatch menyebabkan:
- Inkonsistensi data
- Kebingungan developer
- Potential data loss saat migration

**Prioritas:** HIGH  
**Estimasi risiko:** HIGH - Affects entire database structure

---

### 4. Dual Backend Consolidation

**Files yang perlu diubah:**
- `flask_app/` (Flask/Python)
- `backend/` (Node.js)
- `public/` (Frontend)

**Pilihan pendekatan:**

**Option A: Pilih Flask (Python)**
- Keep: `flask_app/`, `app.py`, `config.py`
- Migrate: Semua Node.js endpoints ke Flask
- Delete: `backend/` folder
- Update: Frontend untuk pakai Flask API

**Option B: Pilih Node.js**
- Keep: `backend/`, `server.js`
- Migrate: Semua Flask endpoints ke Node.js
- Delete: `flask_app/` folder
- Update: Frontend untuk pakai Node.js API

**Pilihan yang direkomendasikan:** Option A (Flask)
- Sudah ada models dan ORM setup
- Sudah ada auth service lengkap
- Blueprint system sudah terorganisir

**Daftar perubahan (Option A):**
1. Audit semua Node.js endpoints di `backend/`
2. Identifikasi endpoint yang tidak ada di Flask
3. Implementasikan endpoint tersebut di Flask blueprints
4. Test semua endpoints
5. Delete `backend/` folder
6. Update `public/js/dashboard.js` untuk menggunakan Flask API `/api/v1/*`
7. Update `server.js` jika masih digunakan untuk static file serving

**Alasan perbaikan:**
- Dual backend = double maintenance
- Potential race conditions dan data inconsistency
- Lebih sulit untuk debug dan maintain

**Prioritas:** HIGH  
**Estimasi risiko:** MEDIUM - Banyak perubahan tapi bisa di-test bertahap

---

### 5. Dokumentasi Cleanup

**Files yang perlu diubah:**
- `docs/README.md`
- `docs/DATABASE_MIGRATION_GUIDE.md`
- `docs/INSTALLATION_GUIDE.md`
- `docs/repository-audit.md` (opsional)
- Comment di `public/index.html`

**Daftar perubahan:**
1. Hapus semua section yang menunjukkan default credentials
2. Hapus semua password dalam plaintext
3. Ganti dengan instruksi untuk setup credentials baru
4. Update `public/index.html` comment (line ~404-408) untuk akurat

**Alasan perbaikan:**
- Dokumentasi adalah public face dari project
- Password dalam docs = security incident
- Documentation harus akurat

**Prioritas:** HIGH  
**Estimasi risiko:** LOW - Documentation changes tidak affect code

---

## PRIORITAS 2 - DISARANKAN

---

### 1. CORS Configuration

**Files yang perlu diubah:**
- `config.py`

**Daftar perubahan:**
```python
# Ganti default '*' dengan explicit origins
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')
if not CORS_ORIGINS or CORS_ORIGINS == ['']:
    if os.environ.get('FLASK_ENV') == 'production':
        raise ValueError('CORS_ORIGINS must be set in production')
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5000']  # Dev only
```

**Alasan perbaikan:**
- CORS '*' allows any domain
- Production harus explicit

**Prioritas:** MEDIUM  
**Estimasi risiko:** LOW

---

### 2. ALLOW_ALL_PERMISSIONS Bypass

**Files yang perlu diubah:**
- `config.py`
- `flask_app/utils/auth.py`

**Daftar perubahan:**
1. Hapus `ALLOW_ALL_PERMISSIONS` config atau
2. Tambah warning di startup jika enabled
3. Log warning setiap kali bypass digunakan

**Alasan perbaikan:**
- Bypass bisa di-enable secara tidak sengaja
- Major security vulnerability

**Prioritas:** MEDIUM  
**Estimasi risiko:** MEDIUM - Bisa break existing tests

---

### 3. Performance Indexes

**Files yang perlu diubah:**
- `flask_app/models/__init__.py`

**Daftar perubahan:**
Tambah indexes untuk:
- `StokMutasi.tanggal_mutasi`
- `StokMutasi.produk_id`
- `StokMutasi.outlet_id`
- `OpnameSession.tanggal_opname`
- `UserSession.user_id`

**Alasan perbaikan:**
Query pada field ini sering dilakukan tapi tidak ada index

**Prioritas:** LOW  
**Estimasi risiko:** LOW - Adding indexes rarely breaks things

---

## PRIORITAS 3 - NICE TO HAVE

---

### 1. Code Refactoring

**Files yang perlu diubah:**
- `flask_app/blueprints/auth.py`

**Daftar perubahan:**
- Extract duplicate login logic
- Create base class untuk similar endpoints

---

### 2. Error Boundary

**Files yang perlu diubah:**
- `public/js/dashboard.js`

**Daftar perubahan:**
- Tambahkan visual indicator saat data dari fallback/mock
- Show toast/notification "Data mungkin tidak akurat"

---

### 3. API Versioning Standardization

**Files yang perlu diubah:**
- Semua API endpoints

**Daftar perubahan:**
- Standardize semua endpoint ke `/api/v1/`
- Hapus versioning yang tidak konsisten

---

## TIMELINE ESTIMASI

| Task | Estimasi Waktu | Dependencies |
|------|---------------|--------------|
| Dashboard Mock Data Removal | 2-3 hari | None |
| Default Credentials Cleanup | 1 hari | None |
| Schema Resolution | 3-5 hari | None |
| Backend Consolidation | 5-7 hari | Schema resolution |
| Documentation Cleanup | 1 hari | None |
| **Total P1** | **12-17 hari** | Sequential |

---

## RISK ASSESSMENT

| Task | Risk Level | Mitigation |
|------|-----------|------------|
| Dashboard Mock Data Removal | MEDIUM | Test setiap feature отдельно |
| Default Credentials Cleanup | HIGH | Backup database sebelum change |
| Schema Resolution | HIGH | Full database backup, test migration |
| Backend Consolidation | MEDIUM | Run both in parallel during transition |
| Documentation Cleanup | LOW | Simple find-replace |

---

## ROLLBACK PLAN

Untuk setiap perubahan kritis:
1. **Backup database** sebelum schema changes
2. **Keep old code** dalam branch terpisah
3. **Feature flag** untuk new functionality
4. **Gradual rollout** - test dengan small dataset dulu

---

## APPROVAL CHECKLIST

Sebelum lanjut ke Sprint 2:

- [ ] All mock data removed from dashboard.js
- [ ] Default credentials changed/removed
- [ ] Default SECRET_KEY removed
- [ ] Passwords removed from documentation
- [ ] Schema resolved (single source of truth)
- [ ] Backend consolidated to single technology
- [ ] All tests passing
- [ ] Security review completed
- [ ] Documentation updated and accurate

---

**Document Created:** 2026-06-09  
**Status:** AWAITING APPROVAL TO PROCEED WITH FIXES