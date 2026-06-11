# Analisis Nama Produk dan Struktur Kategori/Level

## Tujuan
Dokumentasi ini dibuat untuk memastikan bahwa kategori dan level dibentuk dari **data produk yang benar-benar ada**, bukan dari asumsi developer.

---

## 1. Pola Naming Produk yang Ditemukan

### 1.1 Pola Modul (dari mini-review.js)
Berdasarkan analisis `backend/mini-review.js`, ditemukan pola berikut:

| Pattern | Contoh Nama Produk | Level |
|---------|-------------------|-------|
| `Modul Membaca Level N` | Modul Membaca Level 1, Level 2, Level 3 | 1, 2, 3 |
| `Modul Expro PU Level N` | Modul Expro PU Level 1, Level 2 | 1, 2 |
| `Modul Expro MD Level N` | Modul Expro MD Level 1, Level 2, Level 3, Level 4 | 1, 2, 3, 4 |

### 1.2 Pola Kategori (dari getOpnameCategory)
Berdasarkan analisis `js/dashboard.js` dan `backend/opname-kategori-utils.js`:

| Kategori | Kondisi | Contoh |
|----------|---------|--------|
| `modul` | `nama_produk.toLowerCase().startsWith("modul")` | Modul Membaca Level 1, Modul Expro PU Level 2 |
| `poster` | `startsWith("poster")` OR `startsWith("flash")` | Poster A3, Flash Card Bahasa |
| `seragam` | Contains "merah", "kuning", "biru", atau " my" | Seragam Merah Putih, Topi My School |
| `lain-lain` | Default jika tidak match | Aksesoris, Alat Tulis |

---

## 2. Struktur Level yang Ada (dari produk_level_mapping)

Dari schema.sql, terdapat tabel `produk_level_mapping` dengan kolom:
- `sku` - referensi ke produk
- `level_code` - kode level
- `qty_per_siswa` - jumlah per siswa
- `is_active` - status aktif

Dan tabel `outlet_siswa_level_bulanan`:
- `outlet_id` - referensi outlet
- `periode` - bulan/tahun
- `level_code` - kode level
- `jumlah_siswa` - jumlah siswa

### Level yang Teridentifikasi:
```
Level 1, Level 2, Level 3 (Modul Membaca)
Level 1, Level 2 (Modul Expro PU)
Level 1, Level 2, Level 3, Level 4 (Modul Expro MD)
Tas (kategori khusus)
```

---

## 3. Query untuk Analisis Data Aktual

### 3.1 Query untuk melihat semua nama produk unik:
```sql
SELECT DISTINCT nama_produk FROM produk ORDER BY nama_produk;
```

### 3.2 Query untuk analisis pola modular:
```sql
SELECT 
  CASE
    WHEN nama_produk ILIKE 'Modul Membaca Level %' THEN 'Modul Membaca'
    WHEN nama_produk ILIKE 'Modul Expro PU Level %' THEN 'Modul Expro PU'
    WHEN nama_produk ILIKE 'Modul Expro MD Level %' THEN 'Modul Expro MD'
    WHEN nama_produk ILIKE '%tas%' THEN 'Tas'
    ELSE 'Lainnya'
  END AS kelompok,
  nama_produk
FROM produk
ORDER BY kelompok, nama_produk;
```

### 3.3 Query untuk distribusi kategori:
```sql
SELECT 
  CASE
    WHEN LOWER(nama_produk) LIKE 'modul%' THEN 'modul'
    WHEN LOWER(nama_produk) LIKE 'poster%' OR LOWER(nama_produk) LIKE 'flash%' THEN 'poster'
    WHEN LOWER(nama_produk) LIKE '%merah%'
      OR LOWER(nama_produk) LIKE '%kuning%'
      OR LOWER(nama_produk) LIKE '%biru%'
      OR LOWER(nama_produk) LIKE '% my%' THEN 'seragam'
    ELSE 'lain-lain'
  END AS kategori,
  COUNT(*) AS jumlah
FROM produk
GROUP BY kategori
ORDER BY jumlah DESC;
```

### 3.4 Query untuk statistik level:
```sql
SELECT 
  level_code,
  COUNT(*) AS jumlah_sku
FROM produk_level_mapping
WHERE is_active = TRUE
GROUP BY level_code
ORDER BY level_code;
```

---

## 4. Rekomendasi Kategori & Level

### 4.1 Kategori (berdasarkan pola yang ditemukan):
| Kode | Nama | Pattern |
|------|------|---------|
| `modul` | Modul | `nama_produk ILIKE 'modul%'` |
| `tas` | Tas | `nama_produk ILIKE '%tas%'` |
| `seragam` | Seragam | `nama_produk ILIKE '%merah%' OR '%kuning%' OR '%biru%' OR '% my%'` |
| `poster` | Poster/Flashcard | `nama_produk ILIKE 'poster%' OR 'flash%'` |
| `lain_lain` | Lain-lain | Default |

### 4.2 Level (berdasarkan data):
| Kode Level | Deskripsi | Pattern |
|------------|-----------|---------|
| `MODMEM-01` | Modul Membaca Level 1 | `ILIKE 'Modul Membaca Level 1%'` |
| `MODMEM-02` | Modul Membaca Level 2 | `ILIKE 'Modul Membaca Level 2%'` |
| `MODMEM-03` | Modul Membaca Level 3 | `ILIKE 'Modul Membaca Level 3%'` |
| `MODEXP-PU-01` | Modul Expro PU Level 1 | `ILIKE 'Modul Expro PU Level 1%'` |
| `MODEXP-PU-02` | Modul Expro PU Level 2 | `ILIKE 'Modul Expro PU Level 2%'` |
| `MODEXP-MD-01` | Modul Expro MD Level 1 | `ILIKE 'Modul Expro MD Level 1%'` |
| `MODEXP-MD-02` | Modul Expro MD Level 2 | `ILIKE 'Modul Expro MD Level 2%'` |
| `MODEXP-MD-03` | Modul Expro MD Level 3 | `ILIKE 'Modul Expro MD Level 3%'` |
| `MODEXP-MD-04` | Modul Expro MD Level 4 | `ILIKE 'Modul Expro MD Level 4%'` |
| `TAS` | Tas | `ILIKE '%tas%'` |

---

## 5. Catatan Penting

1. **Data-Driven**: Semua kategori dan level di atas berdasarkan pola yang DITEMUKAN dalam kode, BUKAN asumsi developer.

2. **Perlu Validasi**: Pola-pola ini harus divalidasi dengan data aktual dari database sebelum implementasi final.

3. **Fleksibilitas**: Sistem harus bisa mengakomodasi produk baru yang mungkin tidak match dengan pattern yang ada.

4. **Mapping Table**: Direkomendasikan membuat tabel `produk_kategori_mapping` dan `produk_level_mapping` untuk memetakan SKU ke kategori/level secara eksplisit.

---

## 6. Langkah Selanjutnya

1. [ ] Koneksi ke database aktual
2. [ ] Eksekusi query analisis untuk mendapatkan semua nama produk unik
3. [ ] Analisis pola yang muncul dari data nyata
4. [ ] Validasi dan sesuaikan pola dengan temuan
5. [ ] Update dokumentasi ini dengan temuan aktual
6. [ ] Implementasi mapping berdasarkan data yang sudah divalidasi