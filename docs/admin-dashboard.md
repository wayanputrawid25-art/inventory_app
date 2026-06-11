# Admin Dashboard Wireframe — Inventory App Redesign Roadmap Epic 2 Task 2.2

**Status:** DESIGN DRAFT  
**Tujuan:** Mendefinisikan wireframe dashboard admin sebagai acuan layout, komponen, dan prioritas informasi.  
**Tanggal:** 2026-06-08

## 1. Ringkasan

Admin Dashboard adalah halaman awal untuk Super Admin dan Warehouse Admin. Halaman ini harus memberi gambaran cepat tentang kondisi inventory, aktivitas terbaru, approval yang tertunda, dan kesehatan operasional warehouse.

Komponen utama yang ditetapkan:

1. KPI Cards
2. Recent Activity
3. Pending Approval
4. Warehouse Health

## 2. Prinsip Wireframe

1. **Prioritaskan ringkasan operasional:** dashboard menampilkan sinyal penting terlebih dahulu, bukan daftar data lengkap.
2. **Actionable:** setiap card atau panel harus mengarah ke tindakan lanjutan yang jelas.
3. **Scan cepat:** admin harus dapat memahami kondisi warehouse dalam beberapa detik.
4. **Role-aware:** Super Admin dapat melihat semua data, sedangkan Warehouse Admin melihat data operasional yang relevan.
5. **Responsive:** layout desktop dan mobile tetap mempertahankan urutan prioritas informasi.

## 3. Layout Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: Page title, date range filter, warehouse/outlet filter, refresh      │
├──────────────────────────────────────────────────────────────────────────────┤
│ KPI Cards                                                                    │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ Total Stock  │ │ Stock Alert  │ │ Pending SO   │ │ Pending Appr │        │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        │
├──────────────────────────────────────┬───────────────────────────────────────┤
│ Warehouse Health                     │ Pending Approval                      │
│ ┌──────────────────────────────────┐ │ ┌───────────────────────────────────┐ │
│ │ Health score / status summary    │ │ │ Approval queue list               │ │
│ │ Restock risk                     │ │ │ Priority, requester, age, action  │ │
│ │ Opname variance                  │ │ │ CTA: Review approvals             │ │
│ └──────────────────────────────────┘ │ └───────────────────────────────────┘ │
├──────────────────────────────────────┴───────────────────────────────────────┤
│ Recent Activity                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Timeline/table of latest stock movement, opname, approval, and audit    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 4. Layout Mobile

Urutan komponen mobile mengikuti prioritas informasi dan tindakan:

1. Header ringkas dengan filter utama.
2. KPI Cards dalam grid 2 kolom atau horizontal scroll.
3. Pending Approval untuk item yang perlu tindakan cepat.
4. Warehouse Health untuk ringkasan kondisi.
5. Recent Activity sebagai timeline/list di bagian bawah.

```text
┌──────────────────────────────┐
│ Header + filters             │
├──────────────────────────────┤
│ KPI Cards                    │
│ ┌──────────┐ ┌──────────┐    │
│ └──────────┘ └──────────┘    │
│ ┌──────────┐ ┌──────────┐    │
│ └──────────┘ └──────────┘    │
├──────────────────────────────┤
│ Pending Approval             │
├──────────────────────────────┤
│ Warehouse Health             │
├──────────────────────────────┤
│ Recent Activity              │
└──────────────────────────────┘
```

## 5. Komponen Detail

### 5.1 KPI Cards

KPI Cards menampilkan metrik ringkas yang paling penting untuk admin.

**Tujuan:** memberi sinyal cepat tentang kondisi stok dan pekerjaan tertunda.

**Rekomendasi card awal:**

| Card | Deskripsi | Interaksi |
| --- | --- | --- |
| Total Stock | Total stok aktif berdasarkan filter periode/warehouse. | Klik membuka menu Warehouse dengan filter persediaan aktif. |
| Stock Alert | Jumlah SKU yang berada di bawah threshold atau perlu restock. | Klik membuka daftar item restock. |
| Pending Stock Opname | Jumlah perintah atau hasil opname yang belum selesai. | Klik membuka menu Stock Opname. |
| Pending Approval | Jumlah approval yang menunggu keputusan admin. | Klik membuka menu Approval. |

**Elemen visual:**

- Angka utama.
- Label metrik.
- Status badge seperti `Normal`, `Warning`, atau `Critical`.
- Trend sederhana jika data tersedia.
- Icon yang konsisten dengan kategori metrik.

### 5.2 Recent Activity

Recent Activity menampilkan aktivitas terbaru yang membantu admin memahami perubahan terakhir di sistem.

**Tujuan:** memberi jejak operasional cepat tanpa harus membuka halaman audit penuh.

**Contoh aktivitas:**

- Stok masuk atau pembelian baru.
- Stok keluar atau penjualan baru.
- Perintah stock opname dibuat atau diselesaikan.
- Hasil opname disimpan.
- Approval disetujui atau ditolak.
- Perubahan master produk, outlet, atau rak.

**Format item:**

| Field | Keterangan |
| --- | --- |
| Waktu | Timestamp relatif dan/atau tanggal lengkap. |
| Tipe Aktivitas | Kategori seperti stok, opname, approval, audit, atau master data. |
| Deskripsi | Ringkasan aktivitas dalam satu kalimat. |
| Actor | User yang melakukan aktivitas. |
| Link Detail | Navigasi ke record terkait jika tersedia. |

### 5.3 Pending Approval

Pending Approval adalah panel tindakan yang menampilkan keputusan yang perlu segera diambil admin.

**Tujuan:** mengurangi bottleneck pada penyesuaian stok, koreksi data, dan proses kritis lain.

**Isi panel:**

| Field | Keterangan |
| --- | --- |
| Request Type | Jenis approval, misalnya adjustment stok atau koreksi opname. |
| Requester | User yang mengajukan request. |
| Priority | Prioritas berdasarkan risiko, nilai stok, atau umur request. |
| Age | Lama request menunggu approval. |
| Status | Status saat ini, misalnya `Pending Review`. |
| Action | Tombol `Review` untuk membuka detail approval. |

**State yang perlu didukung:**

- Empty state: tidak ada approval tertunda.
- Loading state: data approval sedang dimuat.
- Error state: data approval gagal dimuat.
- Priority state: item high priority ditandai jelas.

### 5.4 Warehouse Health

Warehouse Health merangkum kesehatan operasional inventory dalam satu panel.

**Tujuan:** membantu admin mengenali risiko inventory sebelum menjadi masalah operasional.

**Indikator awal:**

| Indikator | Deskripsi | Status |
| --- | --- | --- |
| Stock Availability | Persentase SKU dengan stok aman. | Healthy / Warning / Critical |
| Restock Risk | Jumlah SKU di bawah threshold. | Healthy / Warning / Critical |
| Opname Variance | Tingkat selisih stok sistem versus stok fisik. | Healthy / Warning / Critical |
| Data Integrity | Jumlah anomali data atau movement yang perlu audit. | Healthy / Warning / Critical |

**Visualisasi yang disarankan:**

- Health score ringkas, misalnya 0–100.
- Status badge warna hijau/kuning/merah.
- Mini progress bar untuk tiap indikator.
- Link `View audit` atau `View warehouse details`.

## 6. Data dan Filter

### 6.1 Filter Global

Filter global ditempatkan di header dashboard:

- Periode tanggal.
- Warehouse atau lokasi.
- Outlet jika relevan.
- Kategori produk jika relevan.
- Tombol refresh.

### 6.2 Data Refresh

Rekomendasi perilaku refresh:

1. Data dimuat saat halaman dibuka.
2. Tombol refresh memuat ulang semua komponen dashboard.
3. Filter global memperbarui KPI Cards, Warehouse Health, Pending Approval, dan Recent Activity.
4. Jika auto-refresh digunakan, tampilkan waktu pembaruan terakhir.

## 7. Empty, Loading, dan Error State

| Komponen | Empty State | Loading State | Error State |
| --- | --- | --- | --- |
| KPI Cards | Tampilkan angka 0 atau `No data`. | Skeleton card. | Card menampilkan pesan gagal memuat metrik. |
| Recent Activity | Tampilkan pesan belum ada aktivitas. | Skeleton list/timeline. | Tampilkan retry action. |
| Pending Approval | Tampilkan pesan tidak ada approval tertunda. | Skeleton queue. | Tampilkan retry action. |
| Warehouse Health | Tampilkan status belum tersedia. | Skeleton health panel. | Tampilkan retry action dan fallback status. |

## 8. Navigasi Lanjutan

| Komponen | Target Navigasi |
| --- | --- |
| KPI Total Stock | Warehouse → Persediaan |
| KPI Stock Alert | Warehouse → Persediaan dengan filter restock |
| KPI Pending Stock Opname | Stock Opname → Perintah/History |
| KPI Pending Approval | Approval → Queue |
| Recent Activity item | Detail record terkait atau Audit |
| Warehouse Health | Warehouse detail atau Audit |

## 9. Catatan Implementasi UI

1. Gunakan komponen card untuk KPI agar mudah dipakai ulang.
2. Jangan menampilkan tabel besar di dashboard; gunakan ringkasan dan link ke halaman detail.
3. Pending Approval harus memiliki CTA paling jelas karena memerlukan tindakan admin.
4. Recent Activity sebaiknya dibatasi jumlahnya, misalnya 10–20 item terbaru.
5. Warehouse Health harus mudah dibaca dengan status warna, tetapi tetap menyediakan teks status agar aksesibel.
6. Semua angka KPI harus menunjukkan fallback ketika data belum tersedia.

## 10. Batasan Dokumen

- Dokumen ini hanya mendefinisikan wireframe dan komponen Admin Dashboard.
- Dokumen ini belum mengubah kode frontend, backend, API, atau database.
- Detail visual final, copywriting UI, dan endpoint data akan ditentukan pada task implementasi berikutnya.
