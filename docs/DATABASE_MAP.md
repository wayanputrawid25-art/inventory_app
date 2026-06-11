# 🗄️ PETA BASIS DATA - CV EPIC WAREHOUSE V3

## Sumber Kebenaran: Database Neon PostgreSQL

Dokumen ini adalah hasil audit langsung dari database Neon. Semua implementasi WAJIB mengikuti struktur ini.

---

## FASE 1: STRUKTUR DATABASE

### 1.1 Daftar Tabel (19 Tabel)

| No | Nama Tabel | Baris Data | Primary Key | Deskripsi |
|----|------------|------------|-------------|-----------|
| 1 | `produk` | 99 | `sku` (text) | Master produk |
| 2 | `outlet` | 319 | `id` (serial) | Master outlet/gerai |
| 3 | `users` | 2 | `id` (serial) | User login |
| 4 | `penjualan` | 22,782 | `id` (serial) | Transaksi penjualan |
| 5 | `pembelian` | 533 | `id` (serial) | Transaksi pembelian |
| 6 | `stok_awal` | 102 | `sku` (text) | Stok awal gudang |
| 7 | `stok_penyesuaian` | 0 | `id` (serial) | Penyesuaian stok |
| 8 | `stok_opname` | 5 | `id` (serial) | Header stock opname |
| 9 | `stok_opname_detail` | 92 | `id` (serial) | Detail stock opname |
| 10 | `stok_opname_perintah` | 5 | `id` (serial) | Perintah stock opname |
| 11 | `outlet_stok_awal` | 0 | `id` (serial) | Stok awal per outlet |
| 12 | `outlet_stok_masuk` | 30,953 | `id` (serial) | Stok masuk outlet |
| 13 | `outlet_penjualan` | 0 | `id` (serial) | Penjualan per outlet |
| 14 | `outlet_stok_penyesuaian` | 0 | `id` (serial) | Penyesuaian outlet |
| 15 | `outlet_stok_opname` | 0 | `id` (serial) | Opname per outlet |
| 16 | `outlet_stok_opname_detail` | 0 | `id` (serial) | Detail opname outlet |
| 17 | `outlet_siswa_level_bulanan` | 0 | `id` (serial) | Siswa level per bulan |
| 18 | `outlet_stock_realtime` | 0 | `id` (serial) | Stok realtime outlet |
| 19 | `produk_level_mapping` | 0 | `id` (serial) | Mapping produk ke level |

### 1.2 View (2 View)

| No | Nama View | Deskripsi |
|----|-----------|-----------|
| 1 | `vw_outlet_stock_monthly` | Stok rolling per outlet per bulan |
| 2 | `vw_outlet_level_analysis` | Analisis level siswa |

---

## FASE 2: MODEL BISNIS

### 2.1 Diagram Hubungan

```
┌─────────────────────────────────────────────────────────────────┐
│                         GUDANG (Sumber Stok)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ produk (99 items)                                        │   │
│  │ ├── MODUL (25 items) - Level 1-4                         │   │
│  │ ├── TAS (1 item)                                         │   │
│  │ ├── SERAGAM (32 items) - Biru, Kuning, Merah             │   │
│  │ └── LAIN-LAIN (41 items)                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│         ┌─────────────────────┼─────────────────────┐          │
│         ▼                     ▼                     ▼          │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐   │
│  │ pembelian  │       │ penjualan   │       │stok_opname  │   │
│  │ (533 rows) │       │ (22,782)    │       │ (5 sessions)│   │
│  └─────────────┘       └─────────────┘       └─────────────┘   │
│         │                     │                     │          │
│         └─────────────────────┴─────────────────────┘          │
│                              │                                  │
│                              ▼                                  │
│                   ┌─────────────────────┐                       │
│                   │   STOK ROLLING     │                       │
│                   │ Stok Awal + Masuk  │                       │
│                   │ - Penjualan       │                       │
│                   │ + Penyesuaian     │                       │
│                   └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Warehouse Transfer)
┌─────────────────────────────────────────────────────────────────┐
│                    GERAI/PELANGGAN (319 outlets)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ outlet (319 gerai - semua bernama "ANEMONE xxx")         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│                   ┌─────────────────────┐                       │
│                   │ outlet_stok_masuk   │                       │
│                   │ (30,953 transfers)  │                       │
│                   └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Aturan Model Bisnis

1. **GUDANG = PEMBELI STOK**
   - Gudang membeli produk dari supplier
   - Tabel: `pembelian`, `stok_awal`

2. **GERAI = PELANGGAN**
   - Gerai membeli dari gudang (bukan melakukan stock opname)
   - Tabel: `outlet`, `outlet_stok_masuk`
   - 319 gerai, semua bernama "ANEMONE xxx"

3. **STOCK OPNAME HANYA DI GUDANG**
   - Stock opname dilakukan di gudang (bukan di gerai)
   - Tabel: `stok_opname`, `stok_opname_detail`, `stok_opname_perintah`

4. **GERAI TIDAK MEMILIKI STOK**
   - Gerai hanya mencatat `outlet_stok_masuk` (barang masuk dari gudang)
   - Tidak ada tabel `outlet_stok_awal` atau `outlet_stok_penyesuaian` dengan data

---

## FASE 3: ANALISIS PRODUK (99 PRODUK)

### 3.1 Kategori dari Data Aktual

Berdasarkan analisis 99 nama_produk di database:

| Kategori | Kode | Pattern | Jumlah |
|----------|------|---------|--------|
| **MODUL** | `modul` | `nama_produk ILIKE 'MODUL%'` | 25 |
| **TAS** | `tas` | `nama_produk ILIKE 'TAS%'` | 1 |
| **SERAGAM** | `seragam` | `nama_produk ILIKE 'BIRU%'` atau `'KUNING%'` atau `'MERAH%'` | 32 |
| **LAIN-LAIN** | `lain_lain` | Default (tidak match di atas) | 41 |

### 3.2 Detail Kategori

#### MODUL (25 produk)
Terdiri dari 3 jenis modul:

| Jenis | Level | Varian per Level | Contoh |
|-------|-------|------------------|--------|
| **Modul Membaca** | 1, 2, 3 | 2-6 | Modul Membaca Level 1.1, Level 1.2 |
| **Modul Expro MD** | 1, 2, 3, 4 | 2 | Modul Expro MD Level 1.1, Level 1.2 |
| **Modul Expro PU** | 1, 2 | 2 | Modul Expro PU Level 1.1, Level 1.2 |

#### TAS (1 produk)
- Tas Anemone Desain Baru

#### SERAGAM (32 produk)
| Warna | Jumlah | Ukuran |
|-------|--------|--------|
| Biru | 11 | S, M, L, XL, XXL, XXXL |
| Kuning | 10 | S, M, L, XL, XXL, XXXL |
| Merah | 11 | S, M, L, XL, XXL, XXXL |

#### LAIN-LAIN (41 produk)
Termasuk:
- Buku Panduan (3): Ekspro MD, Ekspro PU, Menulis
- Flash Card (1)
- Form (5): Pendaftaran, Pindah Siswa, dll
- Poster (15): Level 1.1 - Level 4
- My Anemone (11): Seragam dengan model berbeda
- Lainnya (6): Logo, Kwitansi, Jadwal, dll

### 3.3 Level untuk MODUL

Level diambil dari pola `LEVEL X.Y` dalam nama_produk:

```
MODUL MEMBACA:
  Level 1: 6 varian (1.1, 1.2, dst)
  Level 2: 5 varian
  Level 3: 2 varian

MODUL EXPRO MD:
  Level 1: 2 varian
  Level 2: 2 varian
  Level 3: 2 varian
  Level 4: 2 varian

MODUL EXPRO PU:
  Level 1: 2 varian
  Level 2: 2 varian
```

### 3.4 Query Kategori

```sql
-- Fungsi kategorisasi produk (tidak disimpan ke database)
SELECT 
  sku,
  nama_produk,
  CASE
    WHEN UPPER(nama_produk) LIKE 'MODUL%' THEN 'modul'
    WHEN UPPER(nama_produk) LIKE 'TAS%' THEN 'tas'
    WHEN UPPER(nama_produk) LIKE 'BIRU%' 
      OR UPPER(nama_produk) LIKE 'KUNING%'
      OR UPPER(nama_produk) LIKE 'MERAH%' THEN 'seragam'
    ELSE 'lain_lain'
  END AS kategori
FROM produk;
```

---

## FASE 4: ANALISIS USER & ROLE

### 4.1 Daftar User (2 user)

| ID | Username | Email | Role | Aktif |
|----|----------|-------|------|-------|
| 1 | admin | admin@warehouse.local | admin | Ya |
| 2 | checker | checker@warehouse.local | checker_opname | Ya |

### 4.2 Role yang Ada

| Role | Akses | Menu |
|------|-------|------|
| **admin** | Full access | Dashboard, Penyedia, Stok Opname, Forecast, User Management, Settings |
| **checker_opname** | Terbatas | Dashboard Saya, Tugas SO, Riwayat Saya, Profil |

### 4.3 Query User

```sql
SELECT id, username, email, role, is_active 
FROM users 
ORDER BY role, username;
```

---

## FASE 5: STRUKTUR KOLOM PENTING

### 5.1 Tabel: produk
```sql
CREATE TABLE produk (
  sku text PRIMARY KEY,           -- Contoh: '100001', '100042'
  nama_produk text,              -- Contoh: 'Modul Expro MD Level 1.1'
  harga_beli numeric,
  harga_jual numeric
);
```

### 5.2 Tabel: outlet
```sql
CREATE TABLE outlet (
  id serial PRIMARY KEY,
  nama_outlet text,               -- Contoh: 'ANEMONE A. YANI'
  created_at timestamp DEFAULT now()
);
```

### 5.3 Tabel: users
```sql
CREATE TABLE users (
  id serial PRIMARY KEY,
  username varchar(100) NOT NULL,
  email varchar(150),
  password_hash varchar(255) NOT NULL,
  nama_lengkap varchar(200) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'staff_gudang',
  outlet_id integer NULL,
  is_active boolean DEFAULT true,
  last_login timestamp,
  failed_login_count integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);
```

### 5.4 Tabel: penjualan
```sql
CREATE TABLE penjualan (
  id serial PRIMARY KEY,
  tanggal date,                  -- Tanggal penjualan
  nama_outlet text,              -- Nama gerai (bukan Gudang)
  sku text,                      -- Referensi ke produk.sku
  qty integer,                   -- Jumlah terjual
  created_at timestamp DEFAULT now()
);
```

### 5.5 Tabel: stok_opname_perintah
```sql
CREATE TABLE stok_opname_perintah (
  id serial PRIMARY KEY,
  kode_so varchar(50) NOT NULL,  -- Kode SO
  tanggal_perintah date NOT NULL,
  bulan integer NOT NULL,
  tahun integer NOT NULL,
  svp_nama varchar(150) NOT NULL, -- Nama SVP
  lokasi varchar(150),
  keterangan text,
  status varchar(30) DEFAULT 'menunggu',
  checker varchar(150),
  opname_id integer,
  kategori_targets text,
  created_at timestamp DEFAULT now(),
  started_at timestamp,
  completed_at timestamp
);
```

---

## FASE 6: STOK ROLLING

### 6.1 Formula Stok Gudang

```
STOK AKHIR = STOK AWAL + PEMBELIAN - PENJUALAN + PENYESUAIAN
```

### 6.2 Query Stok Rolling Gudang

```sql
WITH params AS (
  SELECT $1::date AS end_date  -- Tanggal akhir periode
),
base_stock AS (
  SELECT COALESCE(SUM(qty_awal), 0) AS total_stok_awal
  FROM stok_awal
),
pembelian_total AS (
  SELECT COALESCE(SUM(qty), 0) AS total_pembelian
  FROM pembelian
  WHERE tanggal <= (SELECT end_date FROM params)
),
penjualan_total AS (
  SELECT COALESCE(SUM(qty), 0) AS total_penjualan
  FROM penjualan
  WHERE tanggal <= (SELECT end_date FROM params)
),
penyesuaian_total AS (
  SELECT COALESCE(SUM(qty), 0) AS total_penyesuaian
  FROM stok_penyesuaian
  WHERE tanggal <= (SELECT end_date FROM params)
)
SELECT 
  bs.total_stok_awal,
  pt.total_pembelian,
  pj.total_penjualan,
  pen.total_penyesuaian,
  bs.total_stok_awal + pt.total_pembelian - pj.total_penjualan + pen.total_penyesuaian AS stok_akhir
FROM base_stock bs, pembelian_total pt, penjualan_total pj, penyesuaian_total pen;
```

---

## FASE 7: STATISTIK DATA

### 7.1 Ringkasan

| Entitas | Jumlah | Status |
|---------|--------|--------|
| Produk | 99 | ✅ Ada data |
| Outlet/Gerai | 319 | ✅ Ada data |
| User | 2 | ✅ Ada data |
| Penjualan | 22,782 | ✅ Ada data |
| Pembelian | 533 | ✅ Ada data |
| Stok Opname | 5 | ✅ Ada data |
| Stok Opname Detail | 92 | ✅ Ada data |
| Outlet Stok Masuk | 30,953 | ✅ Ada data |

### 7.2 Data Kosong (Belum Digunakan)

| Tabel | Jumlah | Keterangan |
|-------|--------|------------|
| stok_penyesuaian | 0 | Belum ada penyesuaian |
| outlet_stok_awal | 0 | Belum ada stok awal outlet |
| outlet_penjualan | 0 | Belum ada penjualan outlet |
| outlet_stok_penyesuaian | 0 | Belum ada penyesuaian outlet |
| outlet_stok_opname | 0 | Belum ada opname outlet |
| produk_level_mapping | 0 | Mapping belum di-set |

---

## OUTPUT: RINGKASAN AUDIT

### ✅ Yang Sudah Dicek
1. 19 tabel database
2. 2 view database
3. 99 produk (nama_produk lengkap)
4. 319 outlet
5. 2 user dengan role
6. 22,782 transaksi penjualan
7. 533 transaksi pembelian
8. 5 sesi stock opname

### 📋 Kategori dari Data Nyata
- **MODUL**: 25 produk (3 jenis, Level 1-4)
- **TAS**: 1 produk
- **SERAGAM**: 32 produk (Biru, Kuning, Merah)
- **LAIN-LAIN**: 41 produk

### ⚠️ Perhatian
1. Semua outlet adalah "ANEMONE xxx" - GERAI/PELANGGAN
2. Stock opname dilakukan di GUDANG (bukan di outlet)
3. Tabel `produk_level_mapping` KOSONG - level diambil dari nama_produk
4. View `vw_outlet_stock_monthly` dan `vw_outlet_level_analysis` tersedia tapi belum ada data

---

**Dokumen ini adalah SUMBER KEBENARAN untuk implementasi V3.**

Tanggal Audit: 2026-06-09
Database: Neon PostgreSQL (neondb)