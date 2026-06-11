# Repository Audit — Inventory App Redesign Roadmap Epic 1 Task 1.1

**Status:** READ ONLY  
**Tujuan:** Memahami struktur sistem tanpa mengubah kode aplikasi.  
**Tanggal audit:** 2026-06-08

## 1. Ringkasan Eksekutif

Repository ini berisi aplikasi inventory/warehouse dengan arsitektur **hybrid**:

1. **Frontend statis** berbasis `index.html`, CSS, dan JavaScript vanilla.
2. **Backend Node.js/Express** untuk API operasional dashboard saat ini, memakai PostgreSQL melalui `pg` dan `DATABASE_URL`.
3. **Backend Flask/Python** yang masih tersedia sebagai aplikasi/API versi `v1`, memakai SQLAlchemy, JWT, blueprint modular, dan utilitas barcode/auth.
4. **Database & migrasi** berupa SQL schema/migration PostgreSQL/Neon dan MySQL, plus script migrasi/init.

> Catatan audit: tidak ada perubahan kode aplikasi. Output hanya dokumentasi audit pada `docs/repository-audit.md`.

## 2. Struktur Folder

```text
inventory_app/
├── api/
│   └── index.js                         # Router API Node.js yang memetakan endpoint ke handler backend/
├── assets/
│   └── logo.png                         # Logo aplikasi untuk UI dan favicon
├── backend/                             # Handler API Node.js per fitur/endpoint
├── css/                                 # Stylesheet frontend utama
│   ├── layout.css
│   ├── style.css
│   └── table.css
├── flask_app/                           # Paket backend Flask modular
│   ├── blueprints/                      # Blueprint Flask/API v1
│   ├── models/                          # SQLAlchemy model definitions
│   ├── services/                        # Placeholder/service package Python
│   └── utils/                           # Auth, response/query/date helper, barcode utility
├── js/                                  # Modul JavaScript frontend
│   ├── dashboard.js
│   └── dashboard-opname-perintah.js
├── services/
│   └── db.js                            # Pool koneksi PostgreSQL untuk backend Node.js
├── scripts/                             # Script operasional/migrasi
├── static/
│   └── icons/                           # SVG icon aset statis
├── alembic/versions/                    # Migration history Python/Alembic
├── app.py                               # Entry point aplikasi Flask
├── config.py                            # Konfigurasi Flask/database/JWT/CORS/upload
├── index.html                           # Shell frontend utama
├── server.js                            # Entry point Node.js/Express
├── init-db.js                           # Initializer schema Neon/PostgreSQL
├── package.json                         # Dependency dan npm scripts Node.js
├── requirements.txt                     # Dependency Python/Flask
├── database_schema_mysql_complete.sql   # Schema MySQL lengkap
├── migration_*.sql                      # Migration SQL tambahan
└── README.md / INSTALLATION_GUIDE.md    # Dokumentasi setup
```

### 2.1 File Entry Point

| Area | File | Peran |
| --- | --- | --- |
| Frontend | `index.html` | Layout utama dashboard, auth gate, menu, tab, modal, dan include library CDN. |
| Frontend logic | `js/dashboard.js` | State global dashboard, auth state, filter, data loading, chart, persediaan, audit, forecast, opname, import/export/print. |
| Frontend opname extension | `js/dashboard-opname-perintah.js` | Logika perintah stok opname, hasil SO, indikator kategori, barcode document preview/download. |
| Node API server | `server.js` | Express app, CORS/body parser/static serving, bridge `/api/*` ke `api/index.js`. |
| Node API router | `api/index.js` | Route table yang memetakan method/path ke handler di `backend/`. |
| Node DB service | `services/db.js` | PostgreSQL connection pool berbasis `DATABASE_URL`. |
| Flask app | `app.py` | Application factory, logging, error handler, health check, register blueprint. |
| Flask config | `config.py` | Konfigurasi env, SQLAlchemy URI, JWT, CORS, upload/report/barcode folder, environment selector. |

## 3. Frontend Modules

### 3.1 Shell UI — `index.html`

`index.html` adalah satu halaman utama aplikasi. Komponen utamanya:

- **Auth gate/login-first UI**: modal login dengan mode `User Operasional` dan `Admin`.
- **Header aplikasi**: brand, badge user, tombol login/logout, dan mobile menu toggle.
- **Sidebar navigation**: menu `Penjualan`, `Persediaan`, `Forecasting`, dan `Stok Opname`.
- **Header/filter dashboard**: filter bulan, tahun, dan produk/SKU.
- **Sales/dashboard tabs**: KPI, transaksi outlet, top produk/outlet, chart, dan panel monitoring.
- **Persediaan module**: tabel persediaan, restock, input/import data.
- **Forecast module**: proyeksi kebutuhan/penjualan dengan kategori.
- **Stok opname module**: perintah SO, hasil SO, input scan, history, import, dan generator barcode.
- **Modal & utility nodes**: toast, loader, modal input qty opname.
- **External frontend libraries** via CDN:
  - Chart.js untuk chart.
  - html5-qrcode untuk scanner kamera.
  - lucide untuk icon.
  - JsBarcode untuk barcode SVG.

### 3.2 Dashboard Core — `js/dashboard.js`

`dashboard.js` adalah modul JavaScript terbesar dan menjadi controller utama UI. Pembagian tanggung jawabnya:

| Kelompok | Fungsi/State Utama | Deskripsi |
| --- | --- | --- |
| Global state | `state`, `currentMenu`, chart references | Menyimpan data dashboard, menu aktif, chart instance, data opname, auth-derived UI state. |
| Auth & access | `getStoredAuth`, `isAuthenticated`, `getCurrentUserRole`, `getAllowedMenus`, `canAccessMenu` | Membaca user dari `localStorage`, menentukan menu yang boleh diakses, dan mengarahkan menu default berdasarkan role. |
| UI navigation | `selectMenu`, `showTab`, `showModuleTab`, `showOpnameTab`, `buildDynamicMenu` | Mengatur perpindahan menu/tab, visibilitas konten, dan menu dinamis. |
| Filter & formatting | `bindGlobalFilters`, `getBulan`, `getTahun`, `getSelectedSku`, `formatNumber`, `formatRupiah`, `formatDate`, `escapeHtml` | Mengatur filter global dan format tampilan data. |
| API utility | `getAuthHeaders`, `fetchJson`, `toArray`, `toObject` | Wrapper fetch dan normalisasi response API. |
| Dashboard sales | `loadKPI`, `loadChart`, `loadTopProduk`, `loadTopOutlet`, `loadOutletStatus`, `loadMiniReview` | Mengambil dan merender KPI, chart, top product/outlet, status outlet, dan mini review. |
| Outlet transaction | `loadOutletTransactionMonitor`, `renderOutletTransactionTable`, `renderOutletTransactionDetail` | Monitoring outlet dan detail transaksi outlet. |
| Data input/import | `buildForm`, `submitData`, `buildImportPanel`, `downloadTemplate`, `previewCSV`, `importCSV` | Form input manual, preview CSV, import CSV, dan download template. |
| Persediaan | `loadPersediaan`, `renderPersediaanTables`, `selectPersediaanCategory` | Memuat dan menampilkan stok/persediaan serta kategori persediaan. |
| Audit | `loadAudit`, `renderAuditOverview`, `renderAuditOutletTable`, `renderAuditMovementTable`, `renderAuditFlagTable`, `renderAuditIntegration` | UI audit data outlet, movement, flag, dan integrasi. Menu audit di sidebar saat ini diberi komentar di HTML, namun logika JS masih tersedia. |
| Forecast | `loadForecast`, `renderForecast`, `selectForecastCategory`, `getForecastAccuracy` | Modul forecasting dan metrik akurasi. |
| Opname | `loadOpnameKpiData`, `loadStokSistem`, `hitungSelisih`, `loadHistory`, `showHistoryDetail`, `simpanOpname`, `importOpnameCSV`, `startOpnameScanner`, `applyScannedOpname`, `autoSaveOpname` | Logika stok opname: stok sistem, input fisik, selisih, scanner, autosave, history, import, export. |
| Barcode UI | `loadBarcodeGenerator`, `renderProductBarcode`, `renderRackBarcode`, `downloadBarcodeSvg` | Generator barcode produk/rak di frontend menggunakan JsBarcode. |
| Export/print | `exportCurrentModule`, `downloadCsv`, `printCurrentView`, `openPrintWindow` | Export CSV dan print view untuk modul aktif. |

### 3.3 Perintah Stok Opname — `js/dashboard-opname-perintah.js`

Modul ini memperluas `dashboard.js` untuk workflow **perintah stok opname**:

| Kelompok | Fungsi Utama | Deskripsi |
| --- | --- | --- |
| Form perintah | `initPerintahFormDefaults`, `setPerintahFormMode`, `resetPerintahForm`, `isiFormPerintah`, `simpanPerintahOpname`, `buatPerintahOpname` | Default form, mode tambah/edit, validasi data perintah, dan submit ke API. |
| Kategori opname | `OPNAME_KATEGORI_LIST`, `normalizeKategoriTargets`, `getSelectedPerintahKategori`, `setPerintahKategoriCheckboxes` | Kategori target opname: `modul`, `seragam`, `poster`, `lain-lain`. |
| Indikator kategori | `renderKategoriIndicatorPanel`, `renderPeriodKategoriIndicators`, `computeClientKategoriProgress`, `renderActivePerintahKategoriIndicator` | Menampilkan progres per kategori dalam periode/perintah aktif. |
| List perintah/hasil | `loadPerintahList`, `renderPerintahListSection`, `renderHasilSoList`, `renderSoCard` | Mengambil dan merender daftar perintah serta kartu hasil SO. |
| Aktivasi scan | `activatePerintahForScan`, `updateOpnameInputVisibility`, `clearActivePerintah`, `guardOpnameScanTab` | Menghubungkan perintah aktif dengan tab input/scan opname. |
| Detail hasil SO | `showHasilSoDetailById`, `showHasilSoDetail`, `handleHasilSoClick`, `loadExistingOpnameScan`, `updateHasilSesuaikanButton`, `sesuaikanHasilSO` | Detail hasil opname, penyesuaian stok, dan pemuatan scan sebelumnya. |
| Export hasil | `exportHasilSOcsv` | Export detail hasil SO ke CSV. |
| Barcode document | `buildBarcodeImgDataUrl`, `buildBarcodeDocHtml`, `downloadAllBarcodeDoc`, `previewAllBarcodeDoc` | Preview/download dokumen barcode semua produk. |

### 3.4 CSS & Static Assets

| Path | Isi/Peran |
| --- | --- |
| `css/style.css` | Stylesheet utama aplikasi; mencakup tema dark/red, auth gate, layout dashboard, card, form, table, opname, modal, responsive behavior. |
| `css/layout.css` | Stylesheet layout tambahan/legacy. |
| `css/table.css` | Stylesheet table tambahan/legacy. |
| `assets/logo.png` | Logo utama dan favicon. |
| `static/icons/*.svg` | Ikon statis untuk fitur seperti barang, check-in, wallet, komisi, opname, pembelian, penjualan. |

## 4. Backend Modules

## 4.1 Backend Node.js/Express

### 4.1.1 Server dan Routing

- `server.js`:
  - Menginisialisasi Express.
  - Mengaktifkan CORS.
  - Mengaktifkan JSON/urlencoded body parser dengan limit `10mb`.
  - Melayani static files dari root repository.
  - Meneruskan semua request `/api/*` ke `api/index.js` dengan `req.query.route` yang dinormalisasi.
  - Melayani `index.html` untuk root `/`.

- `api/index.js`:
  - Mengimpor handler dari folder `backend/`.
  - Membuat route table berbasis key `METHOD path`.
  - Menangani endpoint auth, KPI, chart, outlet, persediaan, audit, forecast, stok opname, import, template, dan add data.
  - Mengembalikan 404 bila kombinasi method/path tidak ada.

- `services/db.js`:
  - Membuat PostgreSQL `Pool` dari `DATABASE_URL`.
  - Mengaktifkan SSL `rejectUnauthorized: false` bila connection string tersedia.
  - Menyimpan pool ke `globalThis.__epicWarehousePool` agar reuse di runtime serverless/hot reload.

### 4.1.2 Daftar Handler `backend/`

| File | Endpoint dari `api/index.js` | Peran |
| --- | --- | --- |
| `auth.js` | `POST /v1/auth/login`, `/login/admin`, `/login/user`, `/logout` | Login/logout Node API, validasi portal admin/user. |
| `kpi.js` | `GET /kpi` | KPI dashboard sales/inventory. |
| `chart.js` | `GET /chart` | Data chart penjualan/dashboard. |
| `mini-review.js` | `GET /mini-review` | Ringkasan review singkat dashboard. |
| `top-produk.js` | `GET /top-produk` | Top produk berdasarkan penjualan periode. |
| `top-outlet.js` | `GET /top-outlet` | Top outlet berdasarkan penjualan periode. |
| `outlet-status.js` | `GET /outlet-status` | Status outlet. |
| `outlet-list.js` | `GET /outlet-list` | Daftar outlet. |
| `outlet-transaksi.js` | `GET /outlet-transaksi` | Monitoring transaksi outlet. |
| `persediaan.js` | `GET /persediaan` | Data stok/persediaan. |
| `audit.js` | `GET /audit` | Audit outlet, movement, flag, integrasi, fallback bila tabel belum lengkap. |
| `forecast.js` | `GET /forecast` | Data forecasting. |
| `produk-list.js` | `GET /produk-list` | Daftar produk untuk datalist/filter. |
| `stok-sistem.js` | `GET /stok-sistem` | Perhitungan stok sistem per periode dari stok awal, pembelian, penjualan, penyesuaian. |
| `opname-history.js` | `GET /opname-history` | Riwayat dan detail stok opname. |
| `opname-perintah.js` | `GET/POST /opname-perintah` | Daftar/tambah/edit perintah stok opname. |
| `stok-opname-export.js` | `GET /opname-export` | Export data opname. |
| `simpan-opname.js` | `POST /simpan-opname` | Simpan hasil opname. |
| `sesuaikan-opname.js` | `POST /sesuaikan-opname` | Terapkan selisih opname ke stok penyesuaian. |
| `add-penjualan.js` | `POST /add-penjualan` | Tambah penjualan dan mirror otomatis ke stok outlet bila tabel tersedia. |
| `add-pembelian.js` | `POST /add-pembelian` | Tambah pembelian. |
| `add-stok_awal.js` | `POST /add-stok_awal` | Tambah stok awal. |
| `add-outlet.js` | `POST /add-outlet` | Tambah outlet. |
| `import-penjualan.js` | `POST /import-penjualan` | Import CSV penjualan. |
| `import-pembelian.js` | `POST /import-pembelian` | Import CSV pembelian. |
| `import-stok_awal.js` | `POST /import-stok_awal` | Import CSV stok awal. |
| `import-outlet.js` | `POST /import-outlet` | Import CSV outlet. |
| `template-penjualan.js` | `GET /template-penjualan` | Template CSV penjualan. |
| `template-pembelian.js` | `GET /template-pembelian` | Template CSV pembelian. |
| `template-stok_awal.js` | `GET /template-stok_awal` | Template CSV stok awal. |
| `template-outlet.js` | `GET /template-outlet` | Template CSV outlet. |
| `opname-db-utils.js` | Utility internal | Helper database untuk opname. |
| `opname-kategori-utils.js` | Utility internal | Helper kategori opname. |

### 4.1.3 Karakteristik Backend Node.js

- Style handler mengikuti pola `export default async function handler(req, res)`.
- Sebagian besar handler langsung melakukan query SQL ke PostgreSQL via `pool.query`.
- Validasi input dilakukan per handler.
- Error umum dikembalikan sebagai JSON `{ error: err.message }` dengan status 500.
- Beberapa handler memakai transaksi eksplisit, misalnya `add-penjualan.js` untuk insert penjualan dan mirror outlet stock.
- Router Node tidak memakai Express `Router`, melainkan route table manual di `api/index.js`.

## 4.2 Backend Flask/Python

### 4.2.1 Entry Point & Config

- `app.py`:
  - Menyediakan `create_app()` application factory.
  - Menginisialisasi SQLAlchemy (`db`), JWT, CORS, logging, error handler, blueprint, dan health check `/api/health`.
  - Mendaftarkan blueprint dengan prefix `/api/v1/...`.
  - Melakukan `db.create_all()` best-effort saat startup.

- `config.py`:
  - Membentuk URI database dari `DATABASE_URL` PostgreSQL/Neon atau fallback MySQL env (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).
  - Menyediakan `DevelopmentConfig`, `TestingConfig`, dan `ProductionConfig`.
  - Development memakai SQLite lokal kecuali `DEV_DATABASE_URL` disediakan.
  - Mengatur JWT expiry, CORS origins, upload/barcode/report folder, pagination, logging, dan session cookie.

### 4.2.2 Flask Blueprints

| Blueprint file | Prefix di `app.py` | Peran |
| --- | --- | --- |
| `flask_app/blueprints/auth.py` | `/api/v1/auth` | Endpoint autentikasi Flask. |
| `flask_app/blueprints/produk.py` | `/api/v1/produk` | Manajemen produk. |
| `flask_app/blueprints/rak.py` | `/api/v1/rak` | Manajemen rak/lokasi gudang. |
| `flask_app/blueprints/stok.py` | `/api/v1/stok` | Manajemen stok/mutasi. |
| `flask_app/blueprints/opname.py` | `/api/v1/opname` | Workflow stok opname. |
| `flask_app/blueprints/barcode.py` | `/api/v1/barcode` | Barcode produk/rak. |
| `flask_app/blueprints/scan.py` | `/api/v1/scan` | Scan barcode. |
| `flask_app/blueprints/dashboard.py` | `/api/v1/dashboard` | Endpoint dashboard Flask. |
| `flask_app/blueprints/report.py` | `/api/v1/report` | Reporting/export. |

### 4.2.3 Flask Models

`flask_app/models/__init__.py` berisi model SQLAlchemy untuk domain utama berikut:

- **Auth & user management**: user, role enum, session.
- **Master data**: outlet, kategori produk, supplier, produk.
- **Warehouse structure**: rak, capacity log, lokasi barang.
- **Barcode system**: barcode produk, barcode rak, scan history.
- **Stock management**: stok real time dan mutasi stok.
- **Stock opname**: header/detail opname, discrepancy workflow, approval/adjustment trail.
- **Audit/reporting related entities** sesuai kebutuhan schema Flask.

## 5. Middleware

### 5.1 Middleware Node.js/Express

Middleware global di `server.js`:

| Middleware | Peran |
| --- | --- |
| `cors()` | Mengizinkan cross-origin request untuk API/frontend. |
| `express.json({ limit: '10mb' })` | Parsing JSON body dengan limit 10 MB. |
| `express.urlencoded({ extended: true, limit: '10mb' })` | Parsing form-urlencoded body. |
| `express.static('.')` | Melayani static assets dari root repository. |
| `app.all('/api/*', ...)` | Bridge request API ke route table `api/index.js`. |
| `app.get('/')` | Fallback root untuk mengirim `index.html`. |

Catatan: tidak ditemukan middleware auth global di Node.js. Autentikasi/otorisasi ditangani oleh endpoint/handler terkait dan header auth disiapkan dari frontend melalui `getAuthHeaders()`.

### 5.2 Middleware/Decorator Flask

Middleware/decorator Flask berada terutama di `flask_app/utils/auth.py`:

| Decorator/Service | Peran |
| --- | --- |
| `AuthService` | Hash/verify password, login, logout, register user, token/session creation. |
| `login_required` | Wrapper `jwt_required()` untuk memastikan user aktif. |
| `role_required(*roles)` | Wrapper role-based access control; bisa bypass via `ALLOW_ALL_PERMISSIONS` pada config testing/development. |
| `outlet_access_required` | Validasi akses outlet: admin dapat semua outlet, non-admin hanya outlet sendiri. |

Middleware/komponen Flask di `app.py`:

| Komponen | Peran |
| --- | --- |
| `CORS(app, resources={r"/api/*": ...})` | CORS untuk endpoint API Flask. |
| `JWTManager(app)` | Integrasi JWT Flask. |
| Error handlers 400/401/403/404/500 | Response JSON standar untuk error umum. |
| `setup_logging(app)` | File/console logging. |

## 6. Utilitas

### 6.1 Utilitas Node.js

| File | Peran |
| --- | --- |
| `services/db.js` | Koneksi database PostgreSQL reusable. |
| `backend/opname-db-utils.js` | Helper database stok opname. |
| `backend/opname-kategori-utils.js` | Helper pengelompokan kategori opname. |
| `init-db.js` | Menjalankan schema/migration PostgreSQL/Neon secara idempotent. |
| `scripts/migrate_postgres_to_mysql.js` | Migrasi data PostgreSQL ke MySQL. |

### 6.2 Utilitas Flask/Python

| File | Peran |
| --- | --- |
| `flask_app/utils/auth.py` | Auth service, password hashing, JWT, login/logout, decorator role/outlet access. |
| `flask_app/utils/helpers.py` | Response helper, pagination/filter query helper, date range helper, request validation helper. |
| `flask_app/utils/barcode.py` | Generate barcode/QR code produk dan rak, update print count, ambil URL barcode. |
| `scripts/create_initial_users.py` | Script pembuatan user awal. |
| `scripts/run_sql_file.py` | Runner file SQL. |

### 6.3 Database & Migration Utilities

| File | Peran |
| --- | --- |
| `database_schema_mysql_complete.sql` | Schema MySQL lengkap. |
| `schema.sql` | Schema SQL umum/legacy. |
| `migration_neon_safe.sql` | Sinkronisasi schema Neon/PostgreSQL tanpa drop data. |
| `migration_auth_login.sql` | Tabel/auth login dan default user. |
| `migration_opname_perintah.sql` | Schema untuk perintah stok opname. |
| `migration_opname_kategori.sql` | Schema/penyesuaian kategori opname. |
| `migration_opname_sesuaikan.sql` | Schema/penyesuaian workflow stok opname. |
| `db_audit_outlet_proposal.sql` | Proposal schema audit outlet. |
| `alembic/versions/23701ac6ebc8_initial.py` | Migration awal Alembic untuk stack Flask. |

## 7. Peta Alur Data Tingkat Tinggi

```text
Browser
  │
  ├─ index.html + css/style.css
  │
  ├─ js/dashboard.js
  │   ├─ fetchJson('/api/kpi', ...)
  │   ├─ fetchJson('/api/persediaan', ...)
  │   ├─ fetchJson('/api/opname-perintah', ...)
  │   └─ fetchJson('/api/simpan-opname', ...)
  │
  └─ js/dashboard-opname-perintah.js
      └─ workflow perintah SO / hasil SO / barcode document

Node.js Express server.js
  │
  └─ /api/* → api/index.js route table
      │
      └─ backend/*.js handlers
          │
          └─ services/db.js → PostgreSQL/Neon via DATABASE_URL

Flask app.py (parallel/legacy/API v1)
  │
  └─ /api/v1/* → flask_app/blueprints/*.py
      │
      ├─ flask_app/models SQLAlchemy
      └─ flask_app/utils auth/helpers/barcode
```

## 8. Temuan Audit untuk Roadmap Redesign

1. **Aplikasi saat ini monolit frontend vanilla**: `index.html` dan `js/dashboard.js` memuat banyak tanggung jawab UI sekaligus. Redesign dapat mempertimbangkan pemisahan modul berdasarkan domain: auth, sales, persediaan, forecast, opname, shared utilities.
2. **Backend berjalan dengan dua stack**: Node.js aktif untuk API dashboard saat ini, sementara Flask masih lengkap dan terdokumentasi sebagai API v1. Roadmap perlu memutuskan apakah redesign akan mempertahankan hybrid stack atau melakukan konsolidasi.
3. **Routing Node manual**: `api/index.js` menggunakan route table sederhana. Ini mudah dibaca, tetapi perlu disiplin saat menambah endpoint agar tidak terjadi path collision.
4. **Auth berada di dua tempat**: Node memiliki handler `backend/auth.js`, Flask memiliki `AuthService` dan decorator. Konsistensi role/session perlu diaudit lebih lanjut pada epic berikutnya.
5. **Stok opname adalah area fitur paling kompleks**: logic tersebar di `dashboard.js`, `dashboard-opname-perintah.js`, dan beberapa handler backend (`opname-*`, `stok-sistem`, `simpan-opname`, `sesuaikan-opname`).
6. **Schema/migration cukup banyak**: terdapat file SQL MySQL, PostgreSQL/Neon, migration opname, auth, dan audit outlet. Roadmap perlu inventory dependency schema per fitur sebelum refactor.

## 9. Batasan Audit

- Audit ini hanya membaca struktur dan file repository.
- Tidak dilakukan perubahan kode aplikasi.
- Tidak dilakukan eksekusi server, migration database, atau integration test.
- Tidak dilakukan validasi runtime terhadap API karena task berstatus **READ ONLY**.
