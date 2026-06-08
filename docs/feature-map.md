# Feature Map — Inventory App Redesign Roadmap Epic 1 Task 1.4

**Status:** READ ONLY  
**Tujuan:** Memetakan fitur lama, fungsi bisnis, dan lokasi kode agar redesign dapat dilakukan tanpa kehilangan cakupan fitur.  
**Tanggal audit:** 2026-06-08

## 1. Ringkasan

Aplikasi inventory saat ini memiliki fitur lama yang tersebar di tiga lapisan utama:

1. **Frontend legacy/aktif**: `index.html`, `js/dashboard.js`, `js/dashboard-opname-perintah.js`, dan stylesheet di `css/`.
2. **API runtime Node.js/Express**: `server.js`, `api/index.js`, `backend/*.js`, dan `services/db.js`.
3. **API/model Flask/Python**: `app.py`, `config.py`, `flask_app/blueprints/*.py`, `flask_app/models/__init__.py`, dan `flask_app/utils/*.py`.

> Catatan audit: dokumen ini hanya memetakan fitur dan lokasi kode. Tidak ada perubahan kode aplikasi, tidak ada server dijalankan, dan tidak ada request API live.

## 2. Peta Fitur Lama

| No | Fitur Lama | Fungsi Bisnis | Lokasi Kode Utama |
| --- | --- | --- | --- |
| 1 | Login user/admin | Mengunci dashboard sampai user login, membedakan portal admin dan user operasional, menyimpan session/token di browser. | UI: `index.html` auth gate, `js/dashboard.js` auth helpers. Node: `backend/auth.js`, route `api/index.js`. Flask: `flask_app/blueprints/auth.py`, `flask_app/utils/auth.py`. |
| 2 | Logout dan session user | Menghapus state login frontend dan/atau menutup session user. | UI: `index.html` tombol logout, `js/dashboard.js`. Node: `backend/auth.js`. Flask: `flask_app/blueprints/auth.py`, model `UserSession` di `flask_app/models/__init__.py`. |
| 3 | Role-based menu access | Membatasi menu aktif berdasarkan role user, terutama user operasional diarahkan ke stok opname. | UI: `js/dashboard.js` (`getCurrentUserRole`, `getAllowedMenus`, `canAccessMenu`, `buildDynamicMenu`). Flask decorator: `flask_app/utils/auth.py` (`role_required`). |
| 4 | Dashboard penjualan/KPI | Menampilkan KPI bulanan, total stok/penjualan/pembelian, dan ringkasan performa. | UI: `index.html` tab KPI, `js/dashboard.js` (`loadKPI`, `loadMiniReview`). Node: `backend/kpi.js`, `backend/mini-review.js`. |
| 5 | Grafik penjualan | Menampilkan chart aktivitas/penjualan berdasarkan periode dan filter produk. | UI: `index.html` canvas chart, `js/dashboard.js` (`loadChart`). Node: `backend/chart.js`. Library: Chart.js CDN di `index.html`. |
| 6 | Top produk | Menampilkan produk dengan penjualan tertinggi pada periode aktif. | UI: `index.html`, `js/dashboard.js` (`loadTopProduk`). Node: `backend/top-produk.js`. |
| 7 | Top outlet | Menampilkan outlet dengan penjualan tertinggi pada periode aktif. | UI: `index.html`, `js/dashboard.js` (`loadTopOutlet`). Node: `backend/top-outlet.js`. |
| 8 | Status outlet | Menampilkan status/coverage outlet untuk monitoring distribusi/transaksi. | UI: `index.html`, `js/dashboard.js` (`loadOutletStatus`). Node: `backend/outlet-status.js`. |
| 9 | Monitoring transaksi outlet | Melihat ringkasan outlet dan detail transaksi per outlet/filter. | UI: `index.html`, `js/dashboard.js` (`loadOutletTransactionMonitor`, `renderOutletTransactionTable`, `renderOutletTransactionDetail`). Node: `backend/outlet-transaksi.js`. |
| 10 | Master outlet sederhana | Daftar outlet, tambah outlet manual, import outlet, dan template CSV outlet. | UI: `js/dashboard.js` form/import utilities. Node: `backend/outlet-list.js`, `backend/add-outlet.js`, `backend/import-outlet.js`, `backend/template-outlet.js`. Database: tabel `outlet` pada schema PostgreSQL/Neon. |
| 11 | Master produk/list produk | Menyediakan daftar produk untuk filter, datalist, stok, dan transaksi. | UI: `js/dashboard.js` (`loadProdukOptions`, datalist `produkList`). Node: `backend/produk-list.js`. Flask CRUD: `flask_app/blueprints/produk.py`. Models: `Produk` di `flask_app/models/__init__.py`. |
| 12 | Input penjualan manual | Menambahkan transaksi penjualan warehouse, validasi SKU, dan mirror opsional ke stok outlet. | UI: `js/dashboard.js` (`buildForm`, `submitData`). Node: `backend/add-penjualan.js`. Database: `penjualan`, optional `outlet_stok_masuk`. |
| 13 | Import penjualan CSV | Mengunggah/preview CSV penjualan dan memasukkan transaksi secara bulk. | UI: `js/dashboard.js` (`previewCSV`, `importCSV`, import panel). Node: `backend/import-penjualan.js`. Template: `backend/template-penjualan.js`. |
| 14 | Input pembelian manual | Menambahkan transaksi pembelian/masuk warehouse. | UI: `js/dashboard.js` (`buildForm`, `submitData`). Node: `backend/add-pembelian.js`. Database: `pembelian`. |
| 15 | Import pembelian CSV | Mengunggah/preview CSV pembelian dan memasukkan transaksi secara bulk. | UI: `js/dashboard.js` (`previewCSV`, `importCSV`). Node: `backend/import-pembelian.js`. Template: `backend/template-pembelian.js`. |
| 16 | Input stok awal | Menambahkan saldo awal stok per SKU. | UI: `js/dashboard.js` (`buildForm`, `submitData`). Node: `backend/add-stok_awal.js`. Database: `stok_awal`. |
| 17 | Import stok awal CSV | Mengunggah/preview CSV stok awal dan memasukkan saldo awal secara bulk. | UI: `js/dashboard.js` (`previewCSV`, `importCSV`). Node: `backend/import-stok_awal.js`. Template: `backend/template-stok_awal.js`. |
| 18 | Persediaan warehouse | Menampilkan persediaan/stok akhir berdasarkan stok awal, pembelian, penjualan, dan penyesuaian. | UI: `index.html` modul persediaan, `js/dashboard.js` (`loadPersediaan`, `renderPersediaanTables`). Node: `backend/persediaan.js`. |
| 19 | Restock/stock warning sederhana | Menampilkan item yang perlu restock atau status stok pada tabel persediaan. | UI: `index.html` tabel restock, `js/dashboard.js` (`renderPersediaanTables`, `selectPersediaanCategory`). Node: data dari `backend/persediaan.js`. |
| 20 | Audit outlet/stock | Memeriksa data outlet stock, movement, flag, dan integrasi; memiliki fallback bila tabel audit belum lengkap. | UI: logika masih ada di `js/dashboard.js` (`loadAudit`, `renderAuditOverview`, `renderAuditOutletTable`, `renderAuditMovementTable`, `renderAuditFlagTable`, `renderAuditIntegration`). Node: `backend/audit.js`. SQL proposal: `db_audit_outlet_proposal.sql`. |
| 21 | Forecasting | Membuat proyeksi kebutuhan/penjualan berdasarkan periode dan SKU. | UI: `index.html` menu Forecasting, `js/dashboard.js` (`loadForecast`, `renderForecast`, `selectForecastCategory`). Node: `backend/forecast.js`. |
| 22 | Stok sistem untuk opname | Menghitung stok sistem per SKU sampai akhir periode aktif untuk dibandingkan dengan stok fisik. | UI: `js/dashboard.js` (`loadStokSistem`, `getProductStokSistem`). Node: `backend/stok-sistem.js`. |
| 23 | Perintah stok opname | Membuat, mengedit, menampilkan, mengaktifkan, dan menyelesaikan perintah SO. | UI: `index.html` tab perintah/hasil SO, `js/dashboard-opname-perintah.js` (`loadPerintahList`, `simpanPerintahOpname`, `activatePerintahForScan`). Node: `backend/opname-perintah.js`. Migration: `migration_opname_perintah.sql`. |
| 24 | Kategori target opname | Memilih kategori target SO seperti modul, seragam, poster, lain-lain serta menghitung progres kategori. | UI: `js/dashboard-opname-perintah.js` (`OPNAME_KATEGORI_LIST`, `renderKategoriIndicatorPanel`, `computeClientKategoriProgress`). Node utils: `backend/opname-kategori-utils.js`. Migration: `migration_opname_kategori.sql`. |
| 25 | Input/scan stok opname | Scan/k input SKU/barcode, input qty fisik, hitung selisih, autosave hasil scan. | UI: `index.html` tab input opname, `js/dashboard.js` (`startOpnameScanner`, `applyScannedOpname`, `promptOpnameQty`, `hitungSelisih`, `autoSaveOpname`). Library: html5-qrcode CDN. Node save: `backend/simpan-opname.js`. |
| 26 | Simpan hasil opname | Menyimpan header dan detail hasil opname, termasuk checker, lokasi, item, dan selisih. | UI: `js/dashboard.js` (`simpanOpname`, `autoSaveOpname`). Node: `backend/simpan-opname.js`, `backend/opname-db-utils.js`. Database: `stok_opname`, `stok_opname_detail`. |
| 27 | Hasil/detail stok opname | Melihat detail hasil SO, item selisih, metadata, dan status penyesuaian. | UI: `js/dashboard-opname-perintah.js` (`showHasilSoDetail`, `showHasilSoDetailById`). Node: `backend/opname-history.js`, `backend/stok-opname-export.js`. |
| 28 | Riwayat stok opname | Menampilkan histori stok opname per periode dan membuka detail historis. | UI: `index.html` tab history, `js/dashboard.js` (`loadHistory`, `showHistoryDetail`, `closeHistoryDetail`). Node: `backend/opname-history.js`. |
| 29 | Penyesuaian stok dari opname | Menerapkan selisih hasil opname ke tabel penyesuaian stok agar stok sistem berubah. | UI: `js/dashboard-opname-perintah.js` (`sesuaikanHasilSO`), `js/dashboard.js` (`sesuaikanHistoryOpname`). Node: `backend/sesuaikan-opname.js`. Migration: `migration_opname_sesuaikan.sql`. |
| 30 | Export opname | Export hasil atau history stok opname ke CSV/rows. | UI: `js/dashboard.js` (`exportOpnameHistory`, `exportOpname`, `exportCurrentModule`), `js/dashboard-opname-perintah.js` (`exportHasilSOcsv`). Node: `backend/stok-opname-export.js`. |
| 31 | Import opname CSV | Preview dan import hasil opname dari CSV. | UI: `index.html` tab import opname, `js/dashboard.js` (`downloadOpnameTemplate`, `previewOpnameImport`, `importOpnameCSV`). Backend terkait penyimpanan: `backend/simpan-opname.js`. |
| 32 | Barcode produk frontend | Generate preview/download barcode produk di browser. | UI: `index.html` generator barcode, `js/dashboard.js` (`loadBarcodeGenerator`, `renderProductBarcode`, `downloadBarcodeSvg`). Library: JsBarcode CDN. |
| 33 | Barcode rak frontend | Generate preview/download barcode rak di browser. | UI: `index.html` generator barcode rak, `js/dashboard.js` (`renderRackBarcode`, `downloadBarcodeSvg`). Library: JsBarcode CDN. |
| 34 | Dokumen barcode massal | Preview/download dokumen semua barcode produk untuk kebutuhan print. | UI: `js/dashboard-opname-perintah.js` (`buildBarcodeDocHtml`, `previewAllBarcodeDoc`, `downloadAllBarcodeDoc`). |
| 35 | Barcode backend Flask | Generate, download, bulk-generate barcode produk dan mengambil scan history. | Flask routes: `flask_app/blueprints/barcode.py`. Utility: `flask_app/utils/barcode.py`. Models: `BarcodeProdk`, `BarcodeRak`, `BarcodesScanHistory`. |
| 36 | Scan barcode backend Flask | Scan barcode produk/rak, membuat transaksi scan, melihat pending scan, dan clear pending scan. | Flask routes: `flask_app/blueprints/scan.py`. Models: `TransaksiScan`, `BarcodesScanHistory`, `Produk`, `Rak`. |
| 37 | Manajemen rak Flask | CRUD rak, lookup barcode rak, dan update lokasi barang di rak. | Flask routes: `flask_app/blueprints/rak.py`. Models: `Rak`, `LokasiBarang`, `RakCapacityLog`, `BarcodeRak`. |
| 38 | Stok real-time Flask | Melihat stok real-time, mutasi stok, membuat mutasi, dan summary stok. | Flask routes: `flask_app/blueprints/stok.py`. Models: `StokRealTime`, `StokMutasi`. |
| 39 | Opname Flask | Session opname, item opname, batch/session create, detail, complete, approve, analisis selisih. | Flask routes: `flask_app/blueprints/opname.py`. Models: `OpnameSession`, `OpnameDetail`, `StokOpnameAdjustment`, `SelisihAnalisis`. |
| 40 | Dashboard opname Flask | Statistik opname, notifikasi user, dan mark notification read. | Flask routes: `flask_app/blueprints/dashboard.py`. Models: `Notifikasi`, `StokRealTime`, `StokMutasi`, `Rak`. |
| 41 | Report Flask | Report stok summary, transaksi, opname, dan export Excel stok. | Flask routes: `flask_app/blueprints/report.py`. Library: `openpyxl`. Models: `StokMutasi`, `StokRealTime`, `OpnameSession`, `Produk`, `Outlet`. |
| 42 | Notifikasi Flask | Menyimpan dan menampilkan notifikasi stok/rak/opname/approval. | Models: `Notifikasi`, `NotifikasiConfig` di `flask_app/models/__init__.py`. Endpoint baca/mark-read: `flask_app/blueprints/dashboard.py`. |
| 43 | Audit log Flask | Merekam aktivitas user terhadap entity tertentu. | Model: `AuditLog` di `flask_app/models/__init__.py`. Schema: `database_schema_mysql_complete.sql`. |
| 44 | Laporan stok metadata Flask | Menyimpan metadata laporan stok yang dibuat user. | Model: `LaporanStok` di `flask_app/models/__init__.py`. Schema: `database_schema_mysql_complete.sql`. |
| 45 | Database initialization/migration | Menyiapkan schema PostgreSQL/Neon, auth user, dan migration opname secara idempotent. | Node script: `init-db.js`. SQL: `migration_neon_safe.sql`, `migration_auth_login.sql`, `migration_opname_perintah.sql`, `schema.sql`. |
| 46 | Migrasi PostgreSQL ke MySQL | Memindahkan/mengonversi data dari PostgreSQL legacy ke MySQL schema. | Script: `scripts/migrate_postgres_to_mysql.js`. Schema target: `database_schema_mysql_complete.sql`. |
| 47 | User awal Flask | Membuat user awal untuk stack Flask. | Script: `scripts/create_initial_users.py`. Utility auth: `flask_app/utils/auth.py`. |
| 48 | Runner SQL manual | Menjalankan file SQL tertentu untuk operasional/migrasi. | Script: `scripts/run_sql_file.py`. |
| 49 | Layout/responsiveness/dark theme | Menyediakan tampilan dashboard, auth gate, card, tabel, modal, dan responsive/mobile menu. | HTML: `index.html`. CSS: `css/style.css`, `css/layout.css`, `css/table.css`. JS mobile menu: `js/dashboard.js`. |
| 50 | Static assets/icons | Logo dan ikon menu/fitur lama. | `assets/logo.png`, `static/icons/*.svg`. |

## 3. Peta Lokasi Kode per Area

| Area | Lokasi Kode | Keterangan |
| --- | --- | --- |
| Shell frontend | `index.html` | Struktur halaman, sidebar, tab, form, modal, CDN library. |
| Controller frontend utama | `js/dashboard.js` | Auth state, routing menu, API fetch, chart, persediaan, audit, forecast, opname, export/print. |
| Extension opname | `js/dashboard-opname-perintah.js` | Perintah SO, kategori opname, hasil SO, barcode document. |
| Styling | `css/style.css`, `css/layout.css`, `css/table.css` | Theme, layout, tabel, modal, responsive rules. |
| API router Node | `server.js`, `api/index.js` | Express server dan route table manual. |
| Handler Node | `backend/*.js` | Endpoint runtime yang dipakai frontend saat ini. |
| DB Node | `services/db.js` | PostgreSQL pool berbasis `DATABASE_URL`. |
| Flask app | `app.py`, `config.py` | Application factory, blueprint registration, config env/database/JWT. |
| Flask blueprints | `flask_app/blueprints/*.py` | Endpoint Flask `/api/v1/*`. |
| Flask models | `flask_app/models/__init__.py` | SQLAlchemy model warehouse lengkap. |
| Flask utilities | `flask_app/utils/*.py` | Auth decorator/service, response helper, barcode generator. |
| SQL/migration | `*.sql`, `alembic/versions/*.py` | Schema PostgreSQL/Neon, MySQL, auth/opname/audit migrations. |
| Scripts | `scripts/*.py`, `scripts/*.js`, `scripts/*.ps1` | Init user, run SQL, migration, push helper. |

## 4. Temuan Feature Mapping untuk Redesign

1. **Fitur aktif frontend terkonsentrasi di dua file JS besar.** Redesign sebaiknya memecah `js/dashboard.js` dan `js/dashboard-opname-perintah.js` menjadi modul domain: auth, sales dashboard, persediaan, outlet, forecast, opname, barcode, shared API utilities.
2. **Fitur lama memiliki dua implementasi backend.** Node.js adalah runtime yang dipakai frontend aktif, sedangkan Flask memiliki model domain warehouse yang lebih lengkap.
3. **Stok opname adalah fitur dengan dependensi terbanyak.** Fitur ini menyentuh UI tab, scanner, autosave, perintah SO, kategori, history, export, penyesuaian stok, migration SQL, dan beberapa handler Node.
4. **Barcode ada di frontend dan Flask backend.** Frontend membuat SVG barcode via JsBarcode, sedangkan Flask punya service generate file barcode/QR. Redesign perlu memilih pola tunggal.
5. **Outlet dan produk punya variasi model.** Node/PostgreSQL memakai `outlet` dan `produk.sku`, sedangkan Flask/MySQL memakai `outlets` dan `produk.id/kode_barang`.
6. **Report/notifikasi/audit log lebih matang di Flask model.** Namun frontend aktif lebih banyak memanggil API Node sehingga perlu keputusan source of truth sebelum rebuild UI/API.

## 5. Batasan Audit

- Audit ini tidak menjalankan aplikasi atau test suite.
- Audit ini tidak memvalidasi fitur melalui browser atau API request live.
- Audit ini hanya memetakan fitur berdasarkan file repository dan audit sebelumnya.
- Audit ini tidak mengubah kode aplikasi, database, atau konfigurasi.
