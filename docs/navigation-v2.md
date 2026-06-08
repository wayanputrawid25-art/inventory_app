# Navigation V2 — Inventory App Redesign Roadmap Epic 2 Task 2.1

**Status:** DESIGN DRAFT  
**Tujuan:** Menetapkan struktur menu baru untuk redesign navigasi aplikasi inventory.  
**Tanggal:** 2026-06-08

## 1. Ringkasan

Navigation V2 menyederhanakan menu aplikasi menjadi delapan area utama yang lebih dekat dengan alur kerja operasional gudang, stock opname, approval, pelaporan, audit, dan konfigurasi sistem.

Menu baru yang ditetapkan:

1. Dashboard
2. Task Center
3. Warehouse
4. Stock Opname
5. Approval
6. Reports
7. Audit
8. Settings

## 2. Prinsip Desain Navigasi

1. **Berorientasi tugas:** menu dipisahkan berdasarkan pekerjaan utama user, bukan berdasarkan file atau endpoint legacy.
2. **Mudah dipindai:** jumlah menu utama dibatasi agar sidebar/top navigation tetap ringkas.
3. **Role-aware:** setiap menu dapat ditampilkan, disembunyikan, atau dibuat read-only berdasarkan role target.
4. **Audit-friendly:** aktivitas kritis seperti approval, adjustment, dan perubahan konfigurasi memiliki area navigasi yang jelas.
5. **Scalable:** submenu dapat berkembang tanpa menambah terlalu banyak item di level utama.

## 3. Struktur Menu Baru

| No | Menu | Fokus Utama | Contoh Isi/Submenu | Pengguna Utama |
| --- | --- | --- | --- | --- |
| 1 | Dashboard | Ringkasan performa dan kondisi inventory. | KPI, ringkasan stok, warning restock, aktivitas terbaru. | Super Admin, Warehouse Admin |
| 2 | Task Center | Pusat pekerjaan harian dan assignment. | Tugas saya, antrian tugas, status pekerjaan, notifikasi tindak lanjut. | Warehouse Admin, Operator |
| 3 | Warehouse | Operasional gudang dan master data. | Persediaan, produk, outlet, rak/lokasi, pembelian, penjualan, import data. | Super Admin, Warehouse Admin |
| 4 | Stock Opname | Eksekusi dan monitoring stock opname. | Perintah opname, input/scan opname, history opname, hasil selisih. | Super Admin, Warehouse Admin, Operator |
| 5 | Approval | Persetujuan proses kritis. | Approval penyesuaian stok, approval hasil opname, approval data koreksi. | Super Admin, Warehouse Admin |
| 6 | Reports | Laporan dan export data. | Laporan stok, penjualan, pembelian, opname, outlet, export CSV/Excel. | Super Admin, Warehouse Admin |
| 7 | Audit | Pemeriksaan data, log, dan anomali. | Audit outlet/stock, audit perubahan, log aktivitas, data integrity checks. | Super Admin, Warehouse Admin |
| 8 | Settings | Konfigurasi sistem dan akses. | User management, role/permission, konfigurasi aplikasi, template/import settings. | Super Admin |

## 4. Detail Menu

### 4.1 Dashboard

Dashboard menjadi landing page untuk user manajerial. Area ini menampilkan kondisi bisnis dan inventory secara cepat tanpa memaksa user membuka modul detail.

**Cakupan utama:**

- KPI inventory dan transaksi.
- Ringkasan stok akhir dan status restock.
- Grafik aktivitas/penjualan.
- Top produk dan top outlet.
- Notifikasi ringkas untuk tugas, approval, dan audit issue.

### 4.2 Task Center

Task Center adalah pusat pekerjaan harian. Menu ini membantu user melihat apa yang perlu dikerjakan, siapa PIC-nya, dan status penyelesaian tiap pekerjaan.

**Cakupan utama:**

- Daftar tugas saya.
- Antrian tugas tim warehouse.
- Tugas stock opname yang ditugaskan ke operator.
- Reminder untuk approval atau koreksi yang tertunda.
- Status pekerjaan: belum mulai, berjalan, butuh review, selesai.

### 4.3 Warehouse

Warehouse mengelompokkan fitur operasional gudang dan master data agar tidak tersebar di banyak menu utama.

**Cakupan utama:**

- Persediaan warehouse.
- Master produk.
- Master outlet.
- Rak/lokasi barang.
- Pembelian dan stok masuk.
- Penjualan dan stok keluar.
- Import CSV dan template data operasional.

### 4.4 Stock Opname

Stock Opname menjadi menu khusus untuk seluruh siklus opname, mulai dari pembuatan perintah sampai eksekusi input dan review hasil.

**Cakupan utama:**

- Pembuatan dan monitoring perintah stock opname.
- Input manual hasil opname.
- Scan/barcode opname.
- Riwayat opname.
- Review selisih stok sistem versus stok fisik.

### 4.5 Approval

Approval memisahkan tindakan berisiko tinggi dari menu operasional biasa. Area ini digunakan untuk mengontrol perubahan yang berdampak langsung pada stok atau data penting.

**Cakupan utama:**

- Approval penyesuaian stok dari hasil opname.
- Approval koreksi data inventory.
- Approval import atau perubahan bulk jika diperlukan.
- Tracking status persetujuan dan pemberi approval.

### 4.6 Reports

Reports berfokus pada pelaporan, analisis historis, dan export data.

**Cakupan utama:**

- Laporan stok.
- Laporan pembelian.
- Laporan penjualan.
- Laporan stock opname.
- Laporan outlet.
- Export CSV/Excel.

### 4.7 Audit

Audit digunakan untuk pemeriksaan kualitas data, anomali, dan jejak aktivitas user.

**Cakupan utama:**

- Audit outlet/stock.
- Audit movement stok.
- Log aktivitas user.
- Pemeriksaan data invalid atau tidak sinkron.
- Review perubahan penting pada sistem.

### 4.8 Settings

Settings dibatasi untuk konfigurasi dan administrasi sistem. Menu ini tidak digunakan untuk pekerjaan operasional harian.

**Cakupan utama:**

- Manajemen user.
- Manajemen role dan permission.
- Konfigurasi aplikasi.
- Pengaturan template/import.
- Preferensi sistem dan parameter operasional.

## 5. Mapping Role Target

| Menu | Super Admin | Warehouse Admin | Operator | Catatan |
| --- | --- | --- | --- | --- |
| Dashboard | Full access | Full access | Hidden/limited | Operator cukup mendapat ringkasan tugas di Task Center. |
| Task Center | Full access | Full access | Assigned tasks only | Operator hanya melihat tugas yang relevan. |
| Warehouse | Full access | Full access | Hidden/limited read-only | Operator tidak mengelola master/import. |
| Stock Opname | Full access | Full access | Execute assigned opname | Operator fokus input/scan opname. |
| Approval | Full access | Operational approval | Hidden | Approval tidak diberikan ke Operator. |
| Reports | Full access | Full access | Hidden/limited | Bisa dibuka read-only jika dibutuhkan. |
| Audit | Full access | Operational audit | Hidden | Audit utama untuk admin. |
| Settings | Full access | Hidden/limited | Hidden | Konfigurasi sistem khusus Super Admin. |

## 6. Rekomendasi Urutan Sidebar

Urutan default menu utama:

1. Dashboard
2. Task Center
3. Warehouse
4. Stock Opname
5. Approval
6. Reports
7. Audit
8. Settings

**Alasan urutan:**

- Dashboard dan Task Center ditempatkan paling atas karena menjadi entry point harian.
- Warehouse dan Stock Opname adalah pusat pekerjaan inventory.
- Approval ditempatkan setelah modul operasional karena merupakan tindak lanjut dari aktivitas gudang/opname.
- Reports dan Audit ditempatkan setelah pekerjaan utama karena bersifat review dan analisis.
- Settings ditempatkan terakhir karena digunakan lebih jarang dan berisiko tinggi.

## 7. Catatan Implementasi UI

1. Gunakan label menu persis seperti daftar Navigation V2: `Dashboard`, `Task Center`, `Warehouse`, `Stock Opname`, `Approval`, `Reports`, `Audit`, dan `Settings`.
2. Setiap menu utama sebaiknya memiliki icon konsisten dan active state yang jelas.
3. Sidebar desktop dapat menampilkan seluruh label; mobile dapat memakai drawer atau bottom navigation ringkas untuk menu prioritas.
4. Role filtering dilakukan sebelum render menu agar user tidak melihat menu yang tidak dapat diakses.
5. Jika user hanya memiliki satu area kerja, aplikasi dapat redirect langsung ke halaman yang relevan setelah login.

## 8. Batasan Dokumen

- Dokumen ini hanya mendefinisikan struktur navigasi target.
- Dokumen ini belum mengubah kode frontend, backend, role database, atau permission runtime.
- Detail endpoint dan layout visual tiap halaman perlu diturunkan pada task implementasi berikutnya.
