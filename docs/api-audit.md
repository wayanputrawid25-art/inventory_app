# API Audit — Inventory App Redesign Roadmap Epic 1 Task 1.3

**Status:** READ ONLY  
**Tujuan:** Memahami endpoint API, method, response, dan authentication tanpa mengubah kode aplikasi.  
**Tanggal audit:** 2026-06-08

## 1. Ringkasan Eksekutif

Repository memiliki dua kelompok API:

1. **API runtime Node.js/Express** — aktif untuk frontend saat ini. Semua request `/api/*` diteruskan oleh `server.js` ke route table manual di `api/index.js`, lalu ke handler `backend/*.js`.
2. **API Flask/Python `/api/v1/*`** — tersedia sebagai stack paralel/legacy dengan blueprint, JWT, role decorator, dan response envelope standar via `ResponseHelper`.

> Catatan audit: audit ini hanya membaca file route/handler/decorator. Tidak ada server dijalankan, tidak ada request API live, dan tidak ada perubahan kode aplikasi.

## 2. Sumber Audit

| Sumber | Peran |
| --- | --- |
| `server.js` | Entry Express, static serving, dan bridge `/api/*` ke `api/index.js`. |
| `api/index.js` | Route table Node.js berisi mapping endpoint → handler. |
| `backend/*.js` | Handler endpoint Node.js, response shape, dan validasi per endpoint. |
| `backend/auth.js` | Login/logout Node.js dan token payload base64url custom. |
| `js/dashboard.js` | Frontend utility `fetchJson()` dan `getAuthHeaders()` yang menambahkan Bearer token bila tersedia. |
| `app.py` | Flask app factory, health endpoint, dan blueprint registration. |
| `flask_app/blueprints/*.py` | Endpoint Flask `/api/v1/*`. |
| `flask_app/utils/auth.py` | Decorator `login_required`, `role_required`, `outlet_access_required`. |
| `flask_app/utils/helpers.py` | Standard response envelope Flask: `success`, `message`, `data`, `timestamp`. |

## 3. Pola Routing dan Authentication

### 3.1 Node.js/Express Runtime API

- Base path publik: `/api`.
- `server.js` menerima semua `/api/*`, menghapus prefix `/api`, lalu membentuk `req.query.route` untuk route table.
- `api/index.js` mencari key berbentuk `METHOD /path`.
- Jika route tidak ada, response: `404 { "error": "Route tidak ditemukan: METHOD /path" }`.
- Endpoint Node.js **tidak memiliki middleware authentication global**.
- Frontend mengirim `Authorization: Bearer <access_token>` bila token ada, tetapi handler Node non-auth yang diaudit tidak memverifikasi token/role secara eksplisit.
- Login Node menghasilkan `access_token` dan `refresh_token` custom berbasis base64url + random suffix; token ini bukan JWT terverifikasi di handler Node lain.

### 3.2 Flask `/api/v1/*`

- Base path: `/api/v1` ditambah prefix blueprint.
- Sebagian besar endpoint Flask memakai `@jwt_required()`.
- Endpoint mutasi sensitif memakai kombinasi `@jwt_required()` dan `@role_required(...)`.
- Endpoint login/register publik memakai `@validate_json(...)` tanpa JWT.
- Response Flask umumnya memakai envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "timestamp": "<utc-iso-timestamp>"
}
```

Error Flask umumnya:

```json
{
  "success": false,
  "message": "<error message>",
  "error_code": null,
  "timestamp": "<utc-iso-timestamp>"
}
```

## 4. Audit Endpoint Node.js/Express

### 4.1 Authentication Node.js

| Endpoint | Method | Response Sukses | Error Umum | Authentication |
| --- | --- | --- | --- | --- |
| `/api/v1/auth/login` | POST | `200 { success, message, data: { user_id, username, email, nama_lengkap, role, outlet_id, login_as, access_token, refresh_token, expires_in } }` | `400` username/password kosong; `401` invalid/inactive; `500` gagal proses login | Public; validasi credential ke tabel `users`. |
| `/api/v1/auth/login/admin` | POST | Sama seperti login; hanya portal admin | `401` bila role bukan `admin` | Public; portal validation admin. |
| `/api/v1/auth/login/user` | POST | Sama seperti login; login_as user | `401` bila akun admin masuk portal user | Public; portal validation user operasional. |
| `/api/v1/auth/logout` | POST | `200 { success: true, message: "Logout successful", data: null }` | `404` bila route auth tidak cocok | Tidak memverifikasi token di handler Node; logout stateless. |

### 4.2 Dashboard, Sales, Outlet, dan Produk Node.js

| Endpoint | Method | Query/Body Utama | Response Sukses | Authentication |
| --- | --- | --- | --- | --- |
| `/api/kpi` | GET | `bulan`, `tahun`, optional `sku` | Object KPI dari aggregate SQL: stok awal, pembelian, penjualan, stok akhir/summary terkait | Tidak enforced di backend Node. |
| `/api/chart` | GET | `tahun`, optional `sku` | Array rows chart penjualan per bulan | Tidak enforced. |
| `/api/mini-review` | GET | `bulan`, `tahun` | Object ringkasan: `modul`, `tas_total` atau fallback summary | Tidak enforced. |
| `/api/top-produk` | GET | `bulan`, `tahun`, optional `sku` | Array top produk: `nama_produk`, `total` | Tidak enforced. |
| `/api/top-outlet` | GET | `bulan`, `tahun`, optional `sku` | Array top outlet: `nama_outlet`, `total` | Tidak enforced. |
| `/api/outlet-status` | GET | `bulan`, `tahun`, optional `sku` | Object status outlet/coverage | Tidak enforced. |
| `/api/outlet-list` | GET | - | Array outlet rows | Tidak enforced. |
| `/api/outlet-transaksi` | GET | `bulan`, `tahun`, optional `sku`, `status`, `outlet` | Object/array monitoring transaksi outlet dan detail outlet bila filter outlet dipakai | Tidak enforced. |
| `/api/produk-list` | GET | - | Array produk untuk datalist/filter | Tidak enforced. |

### 4.3 Persediaan, Audit, dan Forecast Node.js

| Endpoint | Method | Query/Body Utama | Response Sukses | Authentication |
| --- | --- | --- | --- | --- |
| `/api/persediaan` | GET | `bulan`, `tahun`, optional `sku` | Array rows persediaan per SKU; error `400` bila bulan/tahun kosong | Tidak enforced. |
| `/api/audit` | GET | `bulan`, `tahun`, optional `sku`, `outlet`, `section` | Object audit section; dapat berisi overview, outlet, movement, flags, integration/fallback metadata | Tidak enforced. |
| `/api/forecast` | GET | optional `bulan`, `tahun`, `sku` | Array rows forecast/kebutuhan berdasarkan periode | Tidak enforced. |

### 4.4 Stok Opname Node.js

| Endpoint | Method | Query/Body Utama | Response Sukses | Authentication |
| --- | --- | --- | --- | --- |
| `/api/stok-sistem` | GET | `bulan`, `tahun`, optional `sku` | Array rows `{ sku, nama_produk, stok }`; error `400` bila bulan/tahun kosong | Tidak enforced. |
| `/api/opname-history` | GET | `bulan`, `tahun`; optional `detail`, `opname_id` | Array summary history atau object detail `{ header, details }` bila detail diminta | Tidak enforced. |
| `/api/opname-perintah` | GET | `bulan`, `tahun`; optional `id`, `kode_so` | Object detail perintah atau object list berisi perintah/indikator kategori | Tidak enforced. |
| `/api/opname-perintah` | POST | body create/update/activate/complete perintah SO | `201/200` object perintah SO; error `400/404/409` untuk validasi/kode duplikat | Tidak enforced. |
| `/api/opname-export` | GET | `bulan`, `tahun`; optional `opname_id` | Array export rows atau object detail export untuk opname tertentu | Tidak enforced. |
| `/api/simpan-opname` | POST | `tanggal`, `items`, `checker`, `lokasi`, `keterangan`, `perintah_id`, optional `partial` | Object `{ message, opname_id, total_item, total_selisih, ... }` | Tidak enforced. |
| `/api/sesuaikan-opname` | POST | `opname_id` | Object hasil penyesuaian stok, jumlah adjustment, total selisih | Tidak enforced. |

### 4.5 Input, Import, dan Template Node.js

| Endpoint | Method | Query/Body Utama | Response Sukses | Authentication |
| --- | --- | --- | --- | --- |
| `/api/add-penjualan` | POST | `tanggal`, `nama_outlet`, `sku`, `qty` | `{ message: "Berhasil ditambahkan" }`; mirror ke outlet stock bila tabel tersedia | Tidak enforced. |
| `/api/add-pembelian` | POST | `tanggal`, `sku`, `qty` | `{ message: "Pembelian berhasil" }` | Tidak enforced. |
| `/api/add-stok_awal` | POST | `sku`, `qty` | `{ message: "Stok awal berhasil" }` | Tidak enforced. |
| `/api/add-outlet` | POST | `nama_outlet` | `{ message: "Outlet berhasil ditambah" }` | Tidak enforced. |
| `/api/import-penjualan` | POST | `csv` | Object hasil import penjualan: total/success/failed/details | Tidak enforced. |
| `/api/import-pembelian` | POST | `csv` | `{ message: "Import pembelian (... data, ... gagal)" }` | Tidak enforced. |
| `/api/import-stok_awal` | POST | `csv` | `{ message: "Import stok awal (... data, ... gagal)" }` | Tidak enforced. |
| `/api/import-outlet` | POST | `csv` | Object hasil import outlet: inserted/skipped/errors | Tidak enforced. |
| `/api/template-outlet` | GET | - | CSV file `template_outlet.csv` | Tidak enforced. |
| `/api/template-penjualan` | GET | - | CSV file `template_penjualan.csv` dengan BOM UTF-8 | Tidak enforced. |
| `/api/template-pembelian` | GET | - | CSV file `template_pembelian.csv` | Tidak enforced. |
| `/api/template-stok_awal` | GET | - | CSV file `template_stok_awal.csv` | Tidak enforced. |

## 5. Audit Endpoint Flask `/api/v1/*`

### 5.1 Health Check

| Endpoint | Method | Response Sukses | Authentication |
| --- | --- | --- | --- |
| `/api/health` | GET | `{ status: "healthy", timestamp, version: "1.0.0" }` | Public. |

### 5.2 Auth Blueprint — `/api/v1/auth`

| Endpoint | Method | Response Sukses | Authentication |
| --- | --- | --- | --- |
| `/api/v1/auth/login` | POST | Envelope success berisi user/token data dari `AuthService.login()` | Public + `validate_json(username,password)`. |
| `/api/v1/auth/login/admin` | POST | Sama seperti login, portal admin | Public + `validate_json`; role harus admin. |
| `/api/v1/auth/login/user` | POST | Sama seperti login, portal user | Public + `validate_json`; admin ditolak di portal user. |
| `/api/v1/auth/register` | POST | `201` envelope data user baru | Public + `validate_json(username,email,password,nama_lengkap)`. |
| `/api/v1/auth/logout` | POST | Envelope success `Logout successful` | JWT required. |
| `/api/v1/auth/me` | GET | Envelope data current user | JWT required. |
| `/api/v1/auth/change-password` | POST | Envelope success `Password changed successfully` | JWT required + `validate_json(old_password,new_password)`. |
| `/api/v1/auth/refresh` | POST | Envelope tokens baru | Refresh JWT required. |
| `/api/v1/auth/sessions` | GET | Envelope array active sessions | JWT required. |
| `/api/v1/auth/logout-all` | POST | Envelope success logout semua session | JWT required. |

### 5.3 Produk, Rak, dan Stok Blueprint

| Endpoint | Method | Response Sukses | Authentication |
| --- | --- | --- | --- |
| `/api/v1/produk/` | GET | Paginated/list produk envelope | JWT required. |
| `/api/v1/produk/<produk_id>` | GET | Detail produk envelope | JWT required. |
| `/api/v1/produk/` | POST | `201` produk baru envelope | JWT + `role_required(admin, staff_gudang)`. |
| `/api/v1/produk/<produk_id>` | PUT | Produk updated envelope | JWT + `role_required(admin, staff_gudang)`. |
| `/api/v1/produk/<produk_id>` | DELETE | Soft delete/success envelope | JWT + `role_required(admin)`. |
| `/api/v1/produk/search` | GET | Search result produk envelope | JWT required. |
| `/api/v1/rak/` | GET | List rak envelope | JWT required. |
| `/api/v1/rak/<rak_id>` | GET | Detail rak envelope | JWT required. |
| `/api/v1/rak/` | POST | `201` rak baru envelope | JWT + `role_required(admin, staff_gudang)`. |
| `/api/v1/rak/<rak_id>` | PUT | Rak updated envelope | JWT + `role_required(admin, staff_gudang)`. |
| `/api/v1/rak/<rak_id>/lokasi-barang` | POST | Update lokasi barang envelope | JWT + `role_required(admin, staff_gudang)`. |
| `/api/v1/rak/by-barcode/<barcode_value>` | GET | Detail rak by barcode envelope | JWT required. |
| `/api/v1/stok/real-time` | GET | List stok real-time envelope | JWT required. |
| `/api/v1/stok/mutasi` | GET | List mutasi stok envelope | JWT required. |
| `/api/v1/stok/mutasi` | POST | `201` mutasi stok envelope | JWT + `role_required(admin, staff_gudang)`. |
| `/api/v1/stok/summary` | GET | Summary stok envelope | JWT required. |

### 5.4 Opname, Barcode, Scan, Dashboard, dan Report Blueprint

| Endpoint | Method | Response Sukses | Authentication |
| --- | --- | --- | --- |
| `/api/v1/opname/session` | GET | List session opname envelope | JWT required. |
| `/api/v1/opname/items` | GET | Item opname/stok system envelope | JWT required. |
| `/api/v1/opname/session/batch` | POST | Batch create session opname envelope | JWT + role_required. |
| `/api/v1/opname/session` | POST | Create session opname envelope | JWT + role_required. |
| `/api/v1/opname/session/<session_id>/detail` | POST | Add/update detail opname envelope | JWT + role_required. |
| `/api/v1/opname/session/<session_id>/complete` | POST | Complete session envelope | JWT + role_required. |
| `/api/v1/opname/session/<session_id>/approve` | POST | Approve session envelope | JWT + role_required. |
| `/api/v1/opname/session/<session_id>/detail/<detail_id>/analisis` | POST | Add analisis selisih envelope | JWT + role_required. |
| `/api/v1/opname/session/<session_id>/detail` | GET | Detail opname envelope | JWT required. |
| `/api/v1/barcode/generate-produk/<produk_id>` | POST | Generate barcode produk envelope | JWT + `role_required(admin, staff_gudang)`. |
| `/api/v1/barcode/produk/<produk_id>/url` | GET | URL barcode produk envelope | JWT required. |
| `/api/v1/barcode/produk/<produk_id>/download` | GET | File/image barcode | JWT required. |
| `/api/v1/barcode/produk/bulk-generate` | POST | Bulk generate barcode envelope | JWT + `role_required(admin, staff_gudang)`. |
| `/api/v1/barcode/scan-history` | GET | Scan history envelope | JWT required. |
| `/api/v1/scan/barcode` | POST | Result scan barcode envelope | JWT + role_required. |
| `/api/v1/scan/transaksi` | POST | Create transaksi scan envelope | JWT + role_required. |
| `/api/v1/scan/pending` | GET | Pending scan envelope | JWT required. |
| `/api/v1/scan/clear-pending` | POST | Clear pending scans envelope | JWT + role_required. |
| `/api/v1/dashboard/opname-stats` | GET | Dashboard opname stats envelope | JWT required. |
| `/api/v1/dashboard/notifications` | GET | Notifications envelope | JWT required. |
| `/api/v1/dashboard/notification/<notif_id>/mark-read` | POST | Mark notification read envelope | JWT required. |
| `/api/v1/report/stok-summary` | GET | Stock summary report envelope | JWT required. |
| `/api/v1/report/transaksi` | GET | Transaction report envelope | JWT required. |
| `/api/v1/report/opname` | GET | Opname report envelope | JWT required. |
| `/api/v1/report/export-excel/stok` | GET | Excel file download | JWT + `role_required(admin, staff_gudang)`. |

## 6. Response dan Error Pattern

### 6.1 Node.js

- Success JSON bervariasi per handler:
  - Array rows langsung untuk endpoint list/chart/top/persediaan.
  - Object aggregate untuk KPI/status/audit/detail.
  - `{ message: "..." }` untuk add/import sederhana.
  - `{ success, message, data }` khusus endpoint auth.
- Error umum:
  - `400 { error: "..." }` untuk input wajib kosong.
  - `404 { error: "..." }` untuk data/route tidak ditemukan.
  - `405 { error: "Method not allowed" }` atau `"Method tidak diizinkan"` untuk method salah pada beberapa handler.
  - `409 { error: "..." }` untuk duplikasi kode SO.
  - `500 { error: err.message }` untuk exception database/handler.

### 6.2 Flask

- Success response umumnya standar via `ResponseHelper.success(data, message, status_code)`.
- Paginated response memakai `ResponseHelper.paginated(...)` dengan field `pagination`.
- Error response memakai `ResponseHelper.error(...)`.
- File download memakai `send_file(...)` dan tidak mengikuti envelope JSON.

## 7. Temuan Audit API untuk Roadmap

1. **Node API adalah API yang paling dekat dengan frontend aktif saat ini.** Route table di `api/index.js` eksplisit dan mudah diaudit, tetapi response shape belum konsisten antar endpoint.
2. **Authentication Node belum enforced di endpoint non-auth.** Frontend menambahkan Bearer token, tetapi handler Node yang diaudit tidak memverifikasi token/role. Ini penting untuk redesign security.
3. **Token Node custom berbeda dari JWT Flask.** Flask memakai `flask_jwt_extended`, sedangkan Node membuat token base64url custom tanpa verifikasi global.
4. **Flask API memiliki pola auth lebih matang.** Banyak endpoint memakai `@jwt_required()` dan endpoint mutasi memakai `@role_required(...)`.
5. **Ada duplikasi domain API antara Node dan Flask.** Produk, stok, opname, report, auth tersedia dalam bentuk berbeda. Roadmap perlu menentukan API source of truth.
6. **Response contract perlu distandardisasi.** Node mengembalikan array/object/message langsung, sedangkan Flask menggunakan envelope `success/message/data/timestamp`.

## 8. Batasan Audit

- Audit ini tidak menjalankan server Node atau Flask.
- Audit ini tidak melakukan request HTTP ke endpoint.
- Audit ini tidak memvalidasi database live atau data produksi.
- Audit ini tidak mengubah kode aplikasi, schema, migration, atau konfigurasi.
