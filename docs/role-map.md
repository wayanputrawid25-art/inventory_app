# Role Map — Inventory App Redesign Roadmap Epic 1 Task 1.5

**Status:** READ ONLY  
**Tujuan:** Memetakan role lama (`Admin`, `User`) ke target role redesign (`Super Admin`, `Warehouse Admin`, `Operator`) tanpa mengubah kode aplikasi.  
**Tanggal audit:** 2026-06-08

## 1. Ringkasan

Role lama pada aplikasi saat ini terlihat dalam dua bentuk:

1. **Portal UI**: halaman login membedakan tab **Admin** dan **User Operasional**.
2. **Role data/backend**: nilai role yang ditemukan adalah `admin`, `staff_gudang`, dan `checker_opname`.

Untuk redesign, role target yang diminta adalah:

- **Super Admin**
- **Warehouse Admin**
- **Operator**

> Catatan audit: dokumen ini hanya memetakan role dan lokasi kode. Tidak ada perubahan kode, permission, database, atau konfigurasi.

## 2. Role Lama yang Ditemukan

| Role/Portal Lama | Representasi Saat Ini | Perilaku/Fungsi Saat Ini | Lokasi Kode |
| --- | --- | --- | --- |
| `Admin` | Portal login admin; role database `admin` | Akses semua menu frontend (`penjualan`, `persediaan`, `forecast`, `opname`) dan masuk lewat endpoint login admin. | UI: `index.html`; menu access: `js/dashboard.js`; Node auth: `backend/auth.js`; Flask auth: `flask_app/utils/auth.py`; model enum: `flask_app/models/__init__.py`; seed auth: `migration_auth_login.sql`. |
| `User` | Portal login user operasional; role database non-admin seperti `staff_gudang` dan `checker_opname` | Di frontend runtime saat ini diarahkan ke menu `Stok Opname`; akun admin ditolak jika masuk portal user. | UI: `index.html`; menu access: `js/dashboard.js`; Node auth: `backend/auth.js`; Flask auth: `flask_app/utils/auth.py`; seed user checker: `migration_auth_login.sql`. |
| `staff_gudang` | Role backend Flask/DB | Pada Flask role ini dapat mengakses beberapa operasi gudang seperti produk/rak/stok bersama admin melalui `role_required('admin', 'staff_gudang')`. Pada frontend Node saat ini tetap masuk kelompok portal `User` bila bukan admin. | Enum/model: `flask_app/models/__init__.py`; decorators: `flask_app/utils/auth.py`; Flask blueprints produk/rak/stok/barcode/report. |
| `checker_opname` | Role backend Flask/DB dan default user operasional | Role operasional untuk stok opname/checker. Pada seed Node/PostgreSQL, user `checker` memakai role `checker_opname`. | Seed: `migration_auth_login.sql`; enum/model: `flask_app/models/__init__.py`; auth validation: `backend/auth.js`, `flask_app/utils/auth.py`. |

## 3. Mapping ke Role Target

| Role Lama | Role Target | Status Mapping | Alasan |
| --- | --- | --- | --- |
| `Admin` / `admin` | **Super Admin** | Mapping utama | Role `admin` saat ini adalah akses tertinggi: portal admin, semua menu frontend, dan allowed role di endpoint mutasi Flask. |
| `Admin` / `admin` | **Warehouse Admin** | Perlu split permission | Sebagian tugas admin saat ini bersifat operasional warehouse. Dalam redesign, aktivitas seperti kelola produk, rak, stok, barcode, opname approval, dan report stok lebih tepat masuk **Warehouse Admin**, bukan selalu **Super Admin**. |
| `User` + `staff_gudang` | **Warehouse Admin** | Mapping disarankan untuk staff gudang senior/admin gudang | `staff_gudang` di Flask dapat menjalankan operasi gudang yang lebih luas daripada operator biasa, sehingga lebih cocok menjadi **Warehouse Admin** bila user tersebut bertanggung jawab mengelola master/stok/rak. |
| `User` + `checker_opname` | **Operator** | Mapping utama untuk user operasional | `checker_opname` dan portal user operasional diarahkan ke pekerjaan stok opname/input/scan, sehingga cocok menjadi **Operator**. |
| `User` non-admin tanpa role spesifik | **Operator** | Default aman | Karena frontend saat ini membatasi non-admin ke `Stok Opname`, default target paling aman adalah **Operator** sampai ada assignment permission yang lebih detail. |

## 4. Matriks Akses Target yang Disarankan

| Area/Fitur | Super Admin | Warehouse Admin | Operator | Catatan dari Sistem Lama |
| --- | --- | --- | --- | --- |
| Login portal admin | Ya | Ya, jika dipisah ke portal admin gudang | Tidak | Saat ini hanya role `admin` boleh portal admin. |
| Login portal user operasional | Tidak perlu | Opsional | Ya | Saat ini non-admin masuk portal user; admin ditolak di portal user. |
| Dashboard penjualan | Ya | Ya | Tidak/terbatas | Frontend lama memberi semua menu hanya untuk `admin`. |
| Persediaan | Ya | Ya | Read-only/terbatas | Cocok untuk Warehouse Admin; Operator bisa dibatasi ke kebutuhan opname. |
| Forecasting | Ya | Ya/opsional | Tidak | Saat ini hanya admin karena termasuk menu admin. |
| Stok opname input/scan | Ya | Ya | Ya | User operasional diarahkan ke opname. |
| Buat/edit perintah SO | Ya | Ya | Tidak/terbatas | Saat ini belum enforced di Node backend; perlu permission eksplisit. |
| Sesuaikan stok dari hasil opname | Ya | Ya | Tidak | Operasi berdampak ke stok sistem, sebaiknya bukan Operator. |
| Master produk/outlet/rak | Ya | Ya | Tidak | Flask mengizinkan `admin` dan `staff_gudang` pada banyak operasi gudang. |
| Import data CSV | Ya | Ya | Tidak/terbatas | Saat ini Node tidak enforce auth; redesign perlu pembatasan. |
| Report/export | Ya | Ya | Read-only terbatas | Flask export stok memakai role admin/staff_gudang. |
| Manajemen user/role | Ya | Tidak/terbatas | Tidak | Target khusus Super Admin. |
| Konfigurasi sistem/migration | Ya | Tidak | Tidak | Target khusus Super Admin. |

## 5. Detail Role Target

### 5.1 Super Admin

**Sumber dari role lama:** `Admin` / `admin` dengan cakupan tertinggi.

**Fungsi target:**

- Manajemen user, role, dan permission.
- Akses semua modul dan konfigurasi sistem.
- Override/approval tertinggi untuk proses kritis.
- Akses penuh ke report, audit, dan data operasional.

**Lokasi kode terkait saat ini:**

- `index.html` tab login Admin.
- `js/dashboard.js` menu access berbasis role `admin`.
- `backend/auth.js` validasi portal admin.
- `flask_app/utils/auth.py` validasi portal admin dan `role_required`.
- `flask_app/models/__init__.py` enum `RoleEnum.ADMIN`.

### 5.2 Warehouse Admin

**Sumber dari role lama:** split dari `Admin` dan/atau promosi `staff_gudang`.

**Fungsi target:**

- Mengelola master produk/outlet/rak.
- Mengelola persediaan, stok masuk/keluar, import data, barcode, dan laporan stok.
- Membuat/mengelola perintah stok opname.
- Menyetujui atau mengeksekusi penyesuaian stok dari hasil opname sesuai aturan bisnis.

**Lokasi kode terkait saat ini:**

- Flask role `staff_gudang` di `flask_app/models/__init__.py`.
- Role checks `role_required('admin', 'staff_gudang')` di blueprints Flask.
- Modul Node terkait master/transaksi: `backend/add-*.js`, `backend/import-*.js`, `backend/persediaan.js`, `backend/opname-perintah.js`, `backend/sesuaikan-opname.js`.
- UI admin lama di `js/dashboard.js` yang saat ini hanya membedakan `admin` vs non-admin.

### 5.3 Operator

**Sumber dari role lama:** `User`, terutama `checker_opname`.

**Fungsi target:**

- Melakukan input/scan stok opname.
- Melihat perintah SO yang ditugaskan.
- Melihat data minimum yang dibutuhkan untuk eksekusi tugas.
- Tidak mengelola master data, import besar, user, atau konfigurasi.

**Lokasi kode terkait saat ini:**

- Portal user operasional di `index.html`.
- Pembatasan menu non-admin ke `opname` di `js/dashboard.js`.
- Default user `checker` dengan role `checker_opname` di `migration_auth_login.sql`.
- Workflow opname di `js/dashboard.js`, `js/dashboard-opname-perintah.js`, `backend/stok-sistem.js`, `backend/simpan-opname.js`, dan `backend/opname-history.js`.

## 6. Gap yang Perlu Diselesaikan Saat Redesign

1. **Role lama hanya membedakan admin vs non-admin di frontend aktif.** Target role membutuhkan minimal tiga level, sehingga perlu permission model lebih eksplisit.
2. **Node backend belum enforce role untuk endpoint non-auth.** Mapping role target tidak cukup jika endpoint tetap menerima request tanpa validasi token/role.
3. **`staff_gudang` ambigu di UI lama.** Di Flask role ini punya wewenang warehouse, tetapi di frontend Node masuk kelompok `User`; redesign perlu memutuskan apakah menjadi **Warehouse Admin** atau **Operator** berdasarkan job description.
4. **Super Admin dan Warehouse Admin masih menyatu pada role `admin`.** Perlu pemisahan permission untuk user management/configuration versus operasional warehouse.
5. **Operator perlu assignment tugas/perintah.** Saat ini user operasional diarahkan ke menu opname, tetapi belum ada pemetaan eksplisit user → perintah SO di dokumen schema runtime.

## 7. Rekomendasi Mapping Awal

| Current Account/Role | Target Role Default | Catatan Migrasi |
| --- | --- | --- |
| `admin` | **Super Admin** | Default akun tertinggi tetap Super Admin. |
| Existing `admin` operasional gudang | **Warehouse Admin** | Perlu identifikasi manual akun admin yang sebenarnya hanya mengelola warehouse. |
| `staff_gudang` | **Warehouse Admin** | Cocok bila bertanggung jawab atas master/stok/rak/import/report. |
| `checker_opname` | **Operator** | Cocok untuk PIC scan/input stok opname. |
| Non-admin tanpa klasifikasi | **Operator** | Default paling aman sampai ada review akses. |

## 8. Batasan Audit

- Audit ini tidak mengubah role database atau permission aplikasi.
- Audit ini tidak menambahkan middleware auth baru.
- Audit ini tidak menjalankan aplikasi atau melakukan login test.
- Audit ini hanya memetakan role berdasarkan kode dan dokumen audit sebelumnya.
