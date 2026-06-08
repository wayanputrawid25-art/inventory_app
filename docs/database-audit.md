# Database Audit — Inventory App Redesign Roadmap Epic 1 Task 1.2

**Status:** READ ONLY  
**Tujuan:** Memahami struktur database tanpa mengubah kode aplikasi atau menjalankan migrasi.  
**Tanggal audit:** 2026-06-08

## 1. Ringkasan Eksekutif

Repository memiliki dua representasi schema database:

1. **Schema runtime Node.js/PostgreSQL/Neon** — digunakan oleh `server.js`, `api/index.js`, handler `backend/*.js`, dan `services/db.js`. Schema ini dibentuk dari `migration_neon_safe.sql` atau fallback `schema.sql`, lalu ditambah `migration_opname_perintah.sql` dan `migration_auth_login.sql` melalui `init-db.js`.
2. **Schema lengkap Flask/MySQL** — didefinisikan dalam `database_schema_mysql_complete.sql` dan selaras dengan banyak model di `flask_app/models/__init__.py`. Schema ini lebih luas, mencakup warehouse/rak/barcode/notifikasi/reporting, dan memakai tabel `outlets` serta primary key produk berbasis `id`.

> Catatan audit: dokumen ini hanya membaca file schema/migration/model. Tidak ada query database live, migration, seed, atau perubahan kode aplikasi.

## 2. Sumber Audit

| Sumber | Peran |
| --- | --- |
| `init-db.js` | Menentukan urutan schema PostgreSQL/Neon yang diterapkan: safe schema, perintah opname, dan auth login. |
| `migration_neon_safe.sql` | Schema PostgreSQL/Neon utama yang aman dijalankan ulang. |
| `schema.sql` | Fallback/default PostgreSQL schema dengan struktur yang hampir sama dengan `migration_neon_safe.sql`. |
| `migration_opname_perintah.sql` | Tambahan tabel/relasi perintah stok opname. |
| `migration_auth_login.sql` | Tambahan tabel users untuk login Node API. |
| `migration_opname_kategori.sql` | Tambahan kolom kategori target pada `stok_opname_perintah`; tidak membuat tabel baru. |
| `migration_opname_sesuaikan.sql` | Tambahan kolom penyesuaian pada `stok_opname`; tidak membuat tabel baru. |
| `db_audit_outlet_proposal.sql` | Proposal/audit outlet stock tables dan view; sebagian tabel sudah masuk `migration_neon_safe.sql`. |
| `database_schema_mysql_complete.sql` | Schema MySQL lengkap untuk stack Flask/SQLAlchemy. |
| `flask_app/models/__init__.py` | Definisi ORM SQLAlchemy untuk domain Flask/MySQL. |

## 3. Database Runtime Node.js/PostgreSQL/Neon

### 3.1 Daftar Tabel, Primary Key, dan Foreign Key

| No | Tabel | Primary Key | Foreign Key | Catatan Relasi/Constraint |
| --- | --- | --- | --- | --- |
| 1 | `produk` | `sku` | - | Master produk pada stack Node/PostgreSQL; `sku` menjadi natural key dan target FK transaksi. |
| 2 | `outlet` | `id` | - | Master outlet; `nama_outlet` unique. |
| 3 | `penjualan` | `id` | `sku` → `produk(sku)` | Transaksi penjualan warehouse; `nama_outlet` berupa teks, bukan FK ke `outlet`. |
| 4 | `pembelian` | `id` | `sku` → `produk(sku)` | Transaksi pembelian/masuk warehouse. |
| 5 | `stok_awal` | `id` | `sku` → `produk(sku)` | Saldo awal stok warehouse per SKU. |
| 6 | `stok_penyesuaian` | `id` | `sku` → `produk(sku)` | Adjustment stok warehouse; dipakai untuk penyesuaian hasil opname. |
| 7 | `stok_opname` | `id` | `perintah_id` → `stok_opname_perintah(id)` `ON DELETE SET NULL` | Header hasil stok opname; relasi `perintah_id` ditambah via `ALTER TABLE`. |
| 8 | `stok_opname_detail` | `id` | `opname_id` → `stok_opname(id)` `ON DELETE CASCADE`; `sku` → `produk(sku)` | Detail hasil opname per SKU. |
| 9 | `stok_opname_perintah` | `id` | `opname_id` → `stok_opname(id)` `ON DELETE SET NULL` | Perintah SO; `kode_so` unique. Terdapat relasi dua arah opsional dengan `stok_opname`. |
| 10 | `outlet_stok_awal` | `id` | `outlet_id` → `outlet(id)`; `sku` → `produk(sku)` | Saldo awal outlet; unique `(outlet_id, sku, periode)`. |
| 11 | `outlet_stok_masuk` | `id` | `outlet_id` → `outlet(id)`; `sku` → `produk(sku)` | Barang masuk outlet; `ref_penjualan_id` tersedia tetapi tidak dideklarasikan sebagai FK. |
| 12 | `outlet_penjualan` | `id` | `outlet_id` → `outlet(id)`; `sku` → `produk(sku)` | Penjualan level outlet. |
| 13 | `outlet_stok_penyesuaian` | `id` | `outlet_id` → `outlet(id)`; `sku` → `produk(sku)` | Adjustment stok outlet. |
| 14 | `outlet_stok_opname` | `id` | `outlet_id` → `outlet(id)` | Header stok opname outlet. |
| 15 | `outlet_stok_opname_detail` | `id` | `opname_id` → `outlet_stok_opname(id)` `ON DELETE CASCADE`; `sku` → `produk(sku)` | Detail opname outlet per SKU. |
| 16 | `produk_level_mapping` | `id` | `sku` → `produk(sku)` | Mapping produk ke level; `sku` unique. |
| 17 | `outlet_siswa_level_bulanan` | `id` | `outlet_id` → `outlet(id)` | Data jumlah siswa per outlet/periode/level; unique `(outlet_id, periode, level_code)`. |
| 18 | `users` | `id` | - | Tabel login Node API; `username` unique, `email` unique/index. `outlet_id` adalah kolom biasa, belum FK di migration auth. |

### 3.2 Relasi Utama PostgreSQL/Neon

```text
produk(sku)
  ├─ penjualan.sku
  ├─ pembelian.sku
  ├─ stok_awal.sku
  ├─ stok_penyesuaian.sku
  ├─ stok_opname_detail.sku
  ├─ outlet_stok_awal.sku
  ├─ outlet_stok_masuk.sku
  ├─ outlet_penjualan.sku
  ├─ outlet_stok_penyesuaian.sku
  ├─ outlet_stok_opname_detail.sku
  └─ produk_level_mapping.sku [UNIQUE]

outlet(id)
  ├─ outlet_stok_awal.outlet_id
  ├─ outlet_stok_masuk.outlet_id
  ├─ outlet_penjualan.outlet_id
  ├─ outlet_stok_penyesuaian.outlet_id
  ├─ outlet_stok_opname.outlet_id
  └─ outlet_siswa_level_bulanan.outlet_id

stok_opname(id)
  ├─ stok_opname_detail.opname_id [ON DELETE CASCADE]
  └─ stok_opname_perintah.opname_id [ON DELETE SET NULL]

stok_opname_perintah(id)
  └─ stok_opname.perintah_id [ON DELETE SET NULL]

outlet_stok_opname(id)
  └─ outlet_stok_opname_detail.opname_id [ON DELETE CASCADE]
```

### 3.3 Constraint Unik PostgreSQL/Neon yang Berpengaruh ke Relasi

| Tabel | Constraint Unique | Dampak |
| --- | --- | --- |
| `outlet` | `nama_outlet` | Nama outlet tidak boleh duplikat. |
| `stok_opname_perintah` | `kode_so` | Satu kode SO hanya untuk satu perintah opname. |
| `outlet_stok_awal` | `(outlet_id, sku, periode)` | Saldo awal outlet unik per outlet/SKU/periode. |
| `produk_level_mapping` | `sku` | Satu SKU hanya punya satu mapping level aktif di tabel mapping. |
| `outlet_siswa_level_bulanan` | `(outlet_id, periode, level_code)` | Jumlah siswa unik per outlet/periode/level. |
| `users` | `username`; `email` | Username/email login tidak boleh duplikat. |

## 4. Database Lengkap Flask/MySQL

Schema MySQL lengkap mencakup 24 tabel. Tabel ini relevan untuk stack Flask dan fitur warehouse yang lebih luas.

### 4.1 Daftar Tabel, Primary Key, dan Foreign Key

| No | Tabel | Primary Key | Foreign Key | Catatan Relasi/Constraint |
| --- | --- | --- | --- | --- |
| 1 | `users` | `id` | `outlet_id` → `outlets(id)` `ON DELETE SET NULL` | User aplikasi; `username` dan `email` unique; role enum. |
| 2 | `user_sessions` | `id` | `user_id` → `users(id)` `ON DELETE CASCADE` | Sesi login user; `session_token` unique. |
| 3 | `role_permissions` | `id` | - | Permission per role; unique `(role, permission)`. |
| 4 | `kategori` | `id` | - | Master kategori; `nama_kategori` unique. |
| 5 | `supplier` | `id` | - | Master supplier; `nama_supplier` unique. |
| 6 | `outlets` | `id` | `manager_id` → `users(id)` `ON DELETE SET NULL` | Master outlet; `nama_outlet` dan `kode_outlet` unique. |
| 7 | `produk` | `id` | `kategori_id` → `kategori(id)` `ON DELETE RESTRICT`; `supplier_id` → `supplier(id)` `ON DELETE RESTRICT`; `created_by` → `users(id)` `ON DELETE RESTRICT` | Master produk Flask/MySQL; `kode_barang` unique. |
| 8 | `rak` | `id` | `outlet_id` → `outlets(id)` `ON DELETE CASCADE` | Rak per outlet; unique `(outlet_id, kode_rak)`; `barcode_rak` unique. |
| 9 | `rak_capacity_logs` | `id` | `rak_id` → `rak(id)` `ON DELETE CASCADE` | Log kapasitas rak. |
| 10 | `lokasi_barang` | `id` | `produk_id` → `produk(id)` `ON DELETE CASCADE`; `rak_id` → `rak(id)` `ON DELETE CASCADE` | Lokasi produk di rak; unique `(produk_id, rak_id)`. |
| 11 | `barcode_produk` | `id` | `produk_id` → `produk(id)` `ON DELETE CASCADE` | Barcode produk; `produk_id` unique, `barcode_value` unique. |
| 12 | `barcode_rak` | `id` | `rak_id` → `rak(id)` `ON DELETE CASCADE` | Barcode rak; `rak_id` unique, `barcode_value` unique. |
| 13 | `barcode_scan_history` | `id` | `user_id` → `users(id)` `ON DELETE CASCADE` | Riwayat scan barcode. |
| 14 | `stok_real_time` | `id` | `produk_id` → `produk(id)` `ON DELETE CASCADE`; `outlet_id` → `outlets(id)` `ON DELETE CASCADE` | Stok real-time per produk/outlet; unique `(produk_id, outlet_id)`. |
| 15 | `stok_mutasi` | `id` | `outlet_id` → `outlets(id)` `ON DELETE RESTRICT`; `produk_id` → `produk(id)` `ON DELETE RESTRICT`; `user_id` → `users(id)` `ON DELETE RESTRICT`; `rak_id` → `rak(id)` `ON DELETE SET NULL`; `approved_by` → `users(id)` `ON DELETE SET NULL` | Mutasi stok lengkap dengan approval dan lokasi rak. |
| 16 | `stok_opname_session` | `id` | `outlet_id` → `outlets(id)` `ON DELETE RESTRICT`; `checker_id` → `users(id)` `ON DELETE RESTRICT`; `approver_id` → `users(id)` `ON DELETE SET NULL` | Header/session stok opname Flask/MySQL. |
| 17 | `stok_opname_detail` | `id` | `opname_session_id` → `stok_opname_session(id)` `ON DELETE CASCADE`; `produk_id` → `produk(id)` `ON DELETE RESTRICT`; `rak_id` → `rak(id)` `ON DELETE SET NULL` | Detail opname per produk/rak. |
| 18 | `stok_opname_adjustment` | `id` | `detail_opname_id` → `stok_opname_detail(id)` `ON DELETE CASCADE`; `approved_by` → `users(id)` `ON DELETE SET NULL` | Adjustment hasil opname; `detail_opname_id` unique. |
| 19 | `selisih_analisis` | `id` | `opname_detail_id` → `stok_opname_detail(id)` `ON DELETE CASCADE` | Analisis penyebab selisih; `opname_detail_id` unique. |
| 20 | `transaksi_scan` | `id` | `outlet_id` → `outlets(id)` `ON DELETE RESTRICT`; `rak_id` → `rak(id)` `ON DELETE SET NULL`; `produk_id` → `produk(id)` `ON DELETE SET NULL`; `user_id` → `users(id)` `ON DELETE RESTRICT` | Riwayat transaksi scan barang/rak. |
| 21 | `notifikasi` | `id` | `user_id` → `users(id)` `ON DELETE CASCADE`; `produk_id` → `produk(id)` `ON DELETE SET NULL`; `rak_id` → `rak(id)` `ON DELETE SET NULL`; `outlet_id` → `outlets(id)` `ON DELETE SET NULL` | Notifikasi user terkait stok/rak/outlet. |
| 22 | `notifikasi_config` | `id` | `outlet_id` → `outlets(id)` `ON DELETE CASCADE` | Konfigurasi notifikasi per outlet; unique `(outlet_id, tipe_notifikasi)`. |
| 23 | `audit_log` | `id` | `user_id` → `users(id)` `ON DELETE CASCADE` | Audit aktivitas user. |
| 24 | `laporan_stok` | `id` | `outlet_id` → `outlets(id)` `ON DELETE CASCADE`; `generated_by` → `users(id)` `ON DELETE RESTRICT` | Metadata laporan stok. |

### 4.2 Relasi Utama Flask/MySQL

```text
users(id)
  ├─ user_sessions.user_id [CASCADE]
  ├─ outlets.manager_id [SET NULL]
  ├─ produk.created_by [RESTRICT]
  ├─ stok_mutasi.user_id [RESTRICT]
  ├─ stok_mutasi.approved_by [SET NULL]
  ├─ stok_opname_session.checker_id [RESTRICT]
  ├─ stok_opname_session.approver_id [SET NULL]
  ├─ stok_opname_adjustment.approved_by [SET NULL]
  ├─ transaksi_scan.user_id [RESTRICT]
  ├─ notifikasi.user_id [CASCADE]
  ├─ audit_log.user_id [CASCADE]
  └─ laporan_stok.generated_by [RESTRICT]

outlets(id)
  ├─ users.outlet_id [SET NULL]
  ├─ rak.outlet_id [CASCADE]
  ├─ stok_real_time.outlet_id [CASCADE]
  ├─ stok_mutasi.outlet_id [RESTRICT]
  ├─ stok_opname_session.outlet_id [RESTRICT]
  ├─ transaksi_scan.outlet_id [RESTRICT]
  ├─ notifikasi.outlet_id [SET NULL]
  ├─ notifikasi_config.outlet_id [CASCADE]
  └─ laporan_stok.outlet_id [CASCADE]

kategori(id)
  └─ produk.kategori_id [RESTRICT]

supplier(id)
  └─ produk.supplier_id [RESTRICT]

produk(id)
  ├─ lokasi_barang.produk_id [CASCADE]
  ├─ barcode_produk.produk_id [CASCADE]
  ├─ stok_real_time.produk_id [CASCADE]
  ├─ stok_mutasi.produk_id [RESTRICT]
  ├─ stok_opname_detail.produk_id [RESTRICT]
  ├─ transaksi_scan.produk_id [SET NULL]
  └─ notifikasi.produk_id [SET NULL]

rak(id)
  ├─ rak_capacity_logs.rak_id [CASCADE]
  ├─ lokasi_barang.rak_id [CASCADE]
  ├─ barcode_rak.rak_id [CASCADE]
  ├─ stok_mutasi.rak_id [SET NULL]
  ├─ stok_opname_detail.rak_id [SET NULL]
  ├─ transaksi_scan.rak_id [SET NULL]
  └─ notifikasi.rak_id [SET NULL]

stok_opname_session(id)
  └─ stok_opname_detail.opname_session_id [CASCADE]

stok_opname_detail(id)
  ├─ stok_opname_adjustment.detail_opname_id [CASCADE, UNIQUE]
  └─ selisih_analisis.opname_detail_id [CASCADE, UNIQUE]
```

## 5. Perbandingan Penting Antar Schema

| Area | PostgreSQL/Neon Runtime | Flask/MySQL Lengkap | Implikasi Redesign |
| --- | --- | --- | --- |
| Nama tabel outlet | `outlet` | `outlets` | Perlu normalisasi naming jika stack digabung. |
| Primary key produk | `produk.sku` | `produk.id`; `kode_barang` unique | Integrasi data perlu mapping `sku` ↔ `kode_barang`/`id`. |
| Auth users | `users` sederhana tanpa FK `outlet_id` | `users` lengkap dengan FK ke `outlets` | Konsistensi role, session, dan outlet assignment perlu diputuskan. |
| Opname warehouse | `stok_opname` + `stok_opname_detail` + `stok_opname_perintah` | `stok_opname_session` + `stok_opname_detail` + adjustment/analysis | Nama dan model workflow opname berbeda. |
| Outlet stock audit | Ada tabel outlet stock dan view proposal | Tidak identik dengan schema MySQL lengkap | Perlu desain domain outlet stock tunggal sebelum refactor. |
| Rak/barcode/notifikasi/reporting | Sebagian besar belum ada di PostgreSQL runtime | Lengkap di MySQL/Flask | Fitur warehouse fisik lebih matang di schema Flask/MySQL. |

## 6. Temuan Audit Database untuk Roadmap

1. **Schema aktif Node/PostgreSQL lebih sederhana dan berbasis SKU sebagai primary key produk.** Ini cocok untuk dashboard dan transaksi CSV, tetapi berbeda dari schema Flask/MySQL yang berbasis surrogate key `produk.id`.
2. **Ada relasi dua arah opsional antara `stok_opname` dan `stok_opname_perintah`.** `stok_opname_perintah.opname_id` dan `stok_opname.perintah_id` sama-sama `ON DELETE SET NULL`; redesign perlu memastikan tidak terjadi ambiguity sumber kebenaran.
3. **`penjualan.nama_outlet` tidak menjadi FK ke `outlet`.** Sementara tabel outlet-stock memakai `outlet_id`, sehingga ada dua pola referensi outlet dalam schema runtime.
4. **`outlet_stok_masuk.ref_penjualan_id` belum FK eksplisit.** Jika kolom ini mereferensikan `penjualan.id`, integritas referensial belum dijamin oleh database.
5. **`users.outlet_id` di PostgreSQL/Neon belum FK eksplisit.** Jika user operasional harus terikat outlet, perlu constraint atau layer validasi yang jelas.
6. **Schema Flask/MySQL punya model warehouse lebih lengkap.** Rak, lokasi barang, barcode, notifikasi, audit log, dan laporan stok sudah punya relasi jelas di schema lengkap.
7. **Ada perbedaan nama dan bentuk model opname.** Runtime memakai `stok_opname`, sedangkan Flask/MySQL memakai `stok_opname_session`; ini perlu diselaraskan sebelum redesign besar.

## 7. Batasan Audit

- Audit ini tidak membaca database live; semua informasi berasal dari file repository.
- Audit ini tidak menjalankan `npm run init-db`, migration SQL, Alembic, atau server.
- Audit ini tidak memvalidasi apakah semua tabel benar-benar sudah ada di environment Neon/MySQL produksi.
- Audit ini tidak mengubah kode aplikasi atau schema database.
