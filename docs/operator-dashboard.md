# Operator Dashboard Wireframe — Inventory App Redesign Roadmap Epic 2 Task 2.3

**Status:** DESIGN DRAFT  
**Tujuan:** Mendefinisikan wireframe dashboard operator untuk pekerjaan harian, progres tugas, dan stock opname aktif.  
**Tanggal:** 2026-06-08

## 1. Ringkasan

Operator Dashboard adalah halaman awal untuk user operasional setelah login. Dashboard ini dibuat sederhana, fokus pada tugas yang harus dikerjakan hari ini dan proses stock opname yang sedang aktif.

Komponen utama yang ditetapkan:

1. Task Hari Ini
2. Progress
3. Opname Aktif

## 2. Prinsip Wireframe

1. **Fokus eksekusi:** operator langsung melihat tugas yang perlu dikerjakan tanpa banyak menu tambahan.
2. **Minim distraksi:** tampilkan hanya informasi yang relevan dengan assignment operator.
3. **Jelas statusnya:** setiap tugas harus memiliki status, prioritas, dan tindakan berikutnya.
4. **Mobile-first:** operator kemungkinan bekerja dari perangkat mobile saat scan/input stok.
5. **Role-safe:** operator tidak melihat data administrasi, approval, atau konfigurasi sistem.

## 3. Layout Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: Operator name, date, location/warehouse, sync status                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ Progress                                                                     │
│ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐       │
│ │ Completed Tasks    │ │ Items Counted      │ │ Variance Found     │       │
│ └────────────────────┘ └────────────────────┘ └────────────────────┘       │
├──────────────────────────────────────┬───────────────────────────────────────┤
│ Task Hari Ini                        │ Opname Aktif                          │
│ ┌──────────────────────────────────┐ │ ┌───────────────────────────────────┐ │
│ │ Assigned tasks list              │ │ │ Active opname card                │ │
│ │ Priority, due time, status       │ │ │ Location, category, progress      │ │
│ │ CTA: Start / Continue            │ │ │ CTA: Continue opname / Scan       │ │
│ └──────────────────────────────────┘ │ └───────────────────────────────────┘ │
└──────────────────────────────────────┴───────────────────────────────────────┘
```

## 4. Layout Mobile

Mobile menjadi layout utama untuk operator karena proses opname biasanya dilakukan sambil bergerak di area warehouse.

Urutan komponen mobile:

1. Header ringkas dengan nama operator, tanggal, dan status sync.
2. Opname Aktif sebagai tindakan paling penting jika ada pekerjaan berjalan.
3. Progress untuk ringkasan penyelesaian tugas.
4. Task Hari Ini untuk daftar pekerjaan berikutnya.

```text
┌──────────────────────────────┐
│ Header + sync status         │
├──────────────────────────────┤
│ Opname Aktif                 │
│ ┌──────────────────────────┐ │
│ │ Active opname + CTA      │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Progress                     │
│ ┌────────┐ ┌────────┐        │
│ └────────┘ └────────┘        │
├──────────────────────────────┤
│ Task Hari Ini                │
│ ┌──────────────────────────┐ │
│ │ Task list                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

## 5. Komponen Detail

### 5.1 Task Hari Ini

Task Hari Ini menampilkan daftar pekerjaan operator pada tanggal berjalan.

**Tujuan:** memastikan operator tahu pekerjaan mana yang harus dimulai, dilanjutkan, atau diselesaikan.

**Isi komponen:**

| Field | Keterangan |
| --- | --- |
| Nama Tugas | Judul tugas seperti stock opname rak, kategori, atau lokasi tertentu. |
| Lokasi | Warehouse, outlet, rak, atau area kerja yang ditugaskan. |
| Prioritas | Normal, high, atau urgent. |
| Due Time | Batas waktu penyelesaian jika tersedia. |
| Status | Belum mulai, berjalan, tertunda, atau selesai. |
| Action | Tombol `Mulai`, `Lanjutkan`, atau `Lihat Detail`. |

**Aturan tampilan:**

- Tugas dengan prioritas tertinggi tampil paling atas.
- Tugas yang sedang berjalan diberi highlight.
- Tugas selesai tetap terlihat pada hari yang sama, tetapi dipindahkan ke bagian bawah atau collapsible section.
- Jika tidak ada tugas, tampilkan empty state yang jelas.

### 5.2 Progress

Progress menampilkan ringkasan capaian operator untuk hari ini.

**Tujuan:** memberi feedback cepat tentang pekerjaan yang sudah selesai dan sisa pekerjaan.

**Rekomendasi metrik awal:**

| Metrik | Deskripsi |
| --- | --- |
| Tugas Selesai | Jumlah tugas selesai dibanding total tugas hari ini. |
| Item Dihitung | Jumlah SKU/item yang sudah diinput atau discan. |
| Progress Opname | Persentase penyelesaian opname aktif atau semua tugas opname hari ini. |
| Selisih Ditemukan | Jumlah item dengan selisih stok sistem dan stok fisik. |

**Elemen visual:**

- Progress bar utama.
- Angka ringkas, misalnya `6/10 tugas` atau `72% selesai`.
- Badge status seperti `On Track`, `Behind`, atau `Completed`.
- Indikator sync bila data belum tersimpan ke server.

### 5.3 Opname Aktif

Opname Aktif menampilkan stock opname yang sedang berjalan atau assignment opname yang paling siap dikerjakan.

**Tujuan:** memberi akses cepat ke input/scan opname tanpa operator mencari menu lain.

**Isi komponen:**

| Field | Keterangan |
| --- | --- |
| Nomor/ID Opname | Identitas perintah stock opname. |
| Area/Kategori | Rak, lokasi, kategori produk, atau outlet yang sedang dihitung. |
| Progress | Persentase item yang sudah dihitung. |
| Last Update | Waktu terakhir operator menyimpan data. |
| Status Sync | Tersimpan, menunggu sync, atau gagal sync. |
| Action | Tombol utama `Lanjutkan Opname` atau `Mulai Scan`. |

**State yang perlu didukung:**

- Tidak ada opname aktif: tampilkan pesan dan arahkan ke Task Hari Ini.
- Opname belum mulai: tampilkan CTA `Mulai Opname`.
- Opname berjalan: tampilkan CTA `Lanjutkan Opname`.
- Opname butuh sync: tampilkan status dan CTA retry sync.
- Opname selesai: tampilkan ringkasan dan arahkan ke tugas berikutnya.

## 6. Navigasi dan Interaksi

| Aksi | Target |
| --- | --- |
| Mulai tugas | Detail tugas atau flow input sesuai jenis tugas. |
| Lanjutkan opname | Halaman Stock Opname input/scan dengan context perintah aktif. |
| Mulai scan | Mode scan barcode untuk opname aktif. |
| Lihat progress | Detail progres tugas hari ini. |
| Retry sync | Mengirim ulang data lokal yang belum tersimpan ke server. |

## 7. Empty, Loading, dan Error State

| Komponen | Empty State | Loading State | Error State |
| --- | --- | --- | --- |
| Task Hari Ini | `Tidak ada tugas untuk hari ini.` | Skeleton task list. | Tampilkan retry dan pesan gagal memuat tugas. |
| Progress | Tampilkan progress 0 dengan label belum ada aktivitas. | Skeleton progress cards. | Tampilkan data terakhir jika tersedia dan pesan error. |
| Opname Aktif | `Tidak ada opname aktif.` | Skeleton active opname card. | Tampilkan retry dan status koneksi/sync. |

## 8. Catatan Implementasi UI

1. CTA utama operator harus selalu jelas: `Mulai`, `Lanjutkan`, atau `Mulai Scan`.
2. Hindari tabel kompleks di mobile; gunakan card list dengan status dan action.
3. Tampilkan status sync secara eksplisit agar operator tahu apakah data sudah tersimpan.
4. Progress harus dihitung dari assignment operator, bukan dari seluruh warehouse.
5. Operator hanya melihat tugas yang ditugaskan kepadanya atau role operasionalnya.
6. Jika hanya ada satu opname aktif, operator dapat diarahkan langsung ke detail opname setelah login.

## 9. Batasan Dokumen

- Dokumen ini hanya mendefinisikan wireframe dan komponen Operator Dashboard.
- Dokumen ini belum mengubah kode frontend, backend, API, database, atau permission runtime.
- Detail visual final dan endpoint data akan ditentukan pada task implementasi berikutnya.
