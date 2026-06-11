-- Safe migration for Neon SQL Editor
-- Tujuan:
-- 1. Menjaga tabel existing tetap aman
-- 2. Menambahkan kolom/tabel yang dibutuhkan aplikasi terbaru
-- 3. Menyiapkan audit stok outlet tanpa merusak data lama

BEGIN;

CREATE TABLE IF NOT EXISTS produk (
  sku VARCHAR(50) PRIMARY KEY,
  nama_produk VARCHAR(255) NOT NULL,
  harga_beli NUMERIC(14,2) DEFAULT 0,
  harga_jual NUMERIC(14,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS outlet (
  id SERIAL PRIMARY KEY,
  nama_outlet VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS penjualan (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  nama_outlet VARCHAR(255) NOT NULL,
  sku VARCHAR(50) NOT NULL REFERENCES produk(sku),
  qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pembelian (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  sku VARCHAR(50) NOT NULL REFERENCES produk(sku),
  qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stok_awal (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) NOT NULL REFERENCES produk(sku),
  qty_awal INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE produk
  ADD COLUMN IF NOT EXISTS harga_beli NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS harga_jual NUMERIC(14,2) DEFAULT 0;

ALTER TABLE outlet
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE penjualan
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE pembelian
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE stok_awal
  ADD COLUMN IF NOT EXISTS qty_awal INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

UPDATE stok_awal
SET qty_awal = COALESCE(qty_awal, 0)
WHERE qty_awal IS NULL;

ALTER TABLE stok_awal
  ALTER COLUMN qty_awal SET DEFAULT 0;

CREATE TABLE IF NOT EXISTS stok_penyesuaian (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  sku VARCHAR(50) NOT NULL REFERENCES produk(sku),
  qty INTEGER NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stok_opname (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  total_item INTEGER NOT NULL DEFAULT 0,
  total_selisih INTEGER NOT NULL DEFAULT 0,
  total_item_selisih INTEGER NOT NULL DEFAULT 0,
  total_selisih_net INTEGER NOT NULL DEFAULT 0,
  checker VARCHAR(150),
  lokasi VARCHAR(150),
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stok_opname_detail (
  id SERIAL PRIMARY KEY,
  opname_id INTEGER NOT NULL REFERENCES stok_opname(id) ON DELETE CASCADE,
  sku VARCHAR(50) NOT NULL REFERENCES produk(sku),
  stok_sistem INTEGER NOT NULL,
  stok_fisik INTEGER NOT NULL,
  selisih INTEGER NOT NULL,
  input_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE stok_opname
  ADD COLUMN IF NOT EXISTS total_item_selisih INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_selisih_net INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

UPDATE stok_opname
SET created_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL;

ALTER TABLE stok_opname_detail
  ADD COLUMN IF NOT EXISTS input_at TIMESTAMP DEFAULT NOW();

CREATE TABLE IF NOT EXISTS stok_opname_perintah (
  id SERIAL PRIMARY KEY,
  kode_so VARCHAR(50) NOT NULL UNIQUE,
  tanggal_perintah DATE NOT NULL,
  bulan INTEGER NOT NULL,
  tahun INTEGER NOT NULL,
  svp_nama VARCHAR(150) NOT NULL,
  lokasi VARCHAR(150),
  keterangan TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'menunggu',
  checker VARCHAR(150),
  opname_id INTEGER REFERENCES stok_opname(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

ALTER TABLE stok_opname
  ADD COLUMN IF NOT EXISTS perintah_id INTEGER REFERENCES stok_opname_perintah(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stok_opname_perintah_periode
  ON stok_opname_perintah (tahun, bulan, tanggal_perintah DESC);

CREATE INDEX IF NOT EXISTS idx_stok_opname_perintah_status
  ON stok_opname_perintah (status);

CREATE INDEX IF NOT EXISTS idx_stok_opname_perintah_kode
  ON stok_opname_perintah (kode_so);

WITH opname_agg AS (
  SELECT
    opname_id,
    COUNT(*)::integer AS total_item,
    COUNT(*) FILTER (WHERE selisih <> 0)::integer AS total_item_selisih,
    COALESCE(SUM(ABS(selisih)), 0)::integer AS total_selisih_abs,
    COALESCE(SUM(selisih), 0)::integer AS total_selisih_net
  FROM stok_opname_detail
  GROUP BY opname_id
)
UPDATE stok_opname h
SET
  total_item = opname_agg.total_item,
  total_selisih = opname_agg.total_selisih_abs,
  total_item_selisih = opname_agg.total_item_selisih,
  total_selisih_net = opname_agg.total_selisih_net,
  updated_at = NOW()
FROM opname_agg
WHERE h.id = opname_agg.opname_id;

CREATE TABLE IF NOT EXISTS outlet_stok_awal (
  id SERIAL PRIMARY KEY,
  outlet_id INTEGER NOT NULL REFERENCES outlet(id),
  sku VARCHAR(50) NOT NULL REFERENCES produk(sku),
  periode DATE NOT NULL,
  qty_awal INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (outlet_id, sku, periode)
);

CREATE TABLE IF NOT EXISTS outlet_stok_masuk (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  outlet_id INTEGER NOT NULL REFERENCES outlet(id),
  sku VARCHAR(50) NOT NULL REFERENCES produk(sku),
  qty INTEGER NOT NULL DEFAULT 0,
  sumber VARCHAR(30) NOT NULL DEFAULT 'warehouse_transfer',
  ref_penjualan_id INTEGER,
  keterangan TEXT,
  checker VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outlet_penjualan (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  outlet_id INTEGER NOT NULL REFERENCES outlet(id),
  sku VARCHAR(50) NOT NULL REFERENCES produk(sku),
  qty INTEGER NOT NULL DEFAULT 0,
  sumber VARCHAR(30) NOT NULL DEFAULT 'sales_outlet',
  keterangan TEXT,
  imported_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outlet_stok_penyesuaian (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  outlet_id INTEGER NOT NULL REFERENCES outlet(id),
  sku VARCHAR(50) NOT NULL REFERENCES produk(sku),
  qty INTEGER NOT NULL,
  alasan TEXT,
  checker VARCHAR(100),
  approved_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outlet_stok_opname (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  outlet_id INTEGER NOT NULL REFERENCES outlet(id),
  total_item INTEGER NOT NULL DEFAULT 0,
  total_selisih INTEGER NOT NULL DEFAULT 0,
  checker VARCHAR(100),
  approved_by VARCHAR(100),
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outlet_stok_opname_detail (
  id SERIAL PRIMARY KEY,
  opname_id INTEGER NOT NULL REFERENCES outlet_stok_opname(id) ON DELETE CASCADE,
  sku VARCHAR(50) NOT NULL REFERENCES produk(sku),
  stok_sistem INTEGER NOT NULL,
  stok_fisik INTEGER NOT NULL,
  selisih INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS produk_level_mapping (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) NOT NULL REFERENCES produk(sku) UNIQUE,
  level_code VARCHAR(50) NOT NULL,
  qty_per_siswa INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outlet_siswa_level_bulanan (
  id SERIAL PRIMARY KEY,
  outlet_id INTEGER NOT NULL REFERENCES outlet(id),
  periode DATE NOT NULL,
  level_code VARCHAR(50) NOT NULL,
  jumlah_siswa INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (outlet_id, periode, level_code)
);

CREATE INDEX IF NOT EXISTS idx_penjualan_tanggal_sku
  ON penjualan (tanggal, sku);

CREATE INDEX IF NOT EXISTS idx_pembelian_tanggal_sku
  ON pembelian (tanggal, sku);

CREATE INDEX IF NOT EXISTS idx_penyesuaian_tanggal_sku
  ON stok_penyesuaian (tanggal, sku);

CREATE INDEX IF NOT EXISTS idx_stok_opname_tanggal
  ON stok_opname (tanggal DESC);

CREATE INDEX IF NOT EXISTS idx_stok_opname_detail_opname
  ON stok_opname_detail (opname_id, sku);

CREATE INDEX IF NOT EXISTS idx_outlet_stok_awal_periode
  ON outlet_stok_awal (periode, outlet_id, sku);

CREATE INDEX IF NOT EXISTS idx_outlet_stok_masuk_tanggal
  ON outlet_stok_masuk (tanggal, outlet_id, sku);

CREATE INDEX IF NOT EXISTS idx_outlet_penjualan_tanggal
  ON outlet_penjualan (tanggal, outlet_id, sku);

CREATE INDEX IF NOT EXISTS idx_outlet_penyesuaian_tanggal
  ON outlet_stok_penyesuaian (tanggal, outlet_id, sku);

CREATE INDEX IF NOT EXISTS idx_produk_level_mapping_level
  ON produk_level_mapping (level_code, sku);

CREATE INDEX IF NOT EXISTS idx_outlet_siswa_level_bulanan
  ON outlet_siswa_level_bulanan (periode, outlet_id, level_code);

INSERT INTO outlet_stok_masuk (tanggal, outlet_id, sku, qty, sumber, ref_penjualan_id, keterangan)
SELECT
  p.tanggal,
  o.id,
  p.sku,
  p.qty,
  'warehouse_sale_auto',
  p.id,
  'Mirror otomatis dari penjualan warehouse ke outlet'
FROM penjualan p
JOIN outlet o ON UPPER(TRIM(o.nama_outlet)) = UPPER(TRIM(p.nama_outlet))
LEFT JOIN outlet_stok_masuk osm ON osm.ref_penjualan_id = p.id
WHERE osm.id IS NULL;

CREATE OR REPLACE VIEW vw_outlet_stock_monthly AS
WITH RECURSIVE opening AS (
  SELECT outlet_id, sku, periode, SUM(qty_awal) AS qty_awal
  FROM outlet_stok_awal
  GROUP BY outlet_id, sku, periode
),
masuk AS (
  SELECT outlet_id, sku, date_trunc('month', tanggal)::date AS periode, SUM(qty) AS qty_masuk
  FROM outlet_stok_masuk
  GROUP BY outlet_id, sku, date_trunc('month', tanggal)::date
),
keluar AS (
  SELECT outlet_id, sku, date_trunc('month', tanggal)::date AS periode, SUM(qty) AS qty_keluar
  FROM outlet_penjualan
  GROUP BY outlet_id, sku, date_trunc('month', tanggal)::date
),
adjust AS (
  SELECT outlet_id, sku, date_trunc('month', tanggal)::date AS periode, SUM(qty) AS qty_adjust
  FROM outlet_stok_penyesuaian
  GROUP BY outlet_id, sku, date_trunc('month', tanggal)::date
),
keys AS (
  SELECT outlet_id, sku, periode FROM opening
  UNION
  SELECT outlet_id, sku, periode FROM masuk
  UNION
  SELECT outlet_id, sku, periode FROM keluar
  UNION
  SELECT outlet_id, sku, periode FROM adjust
),
bounds AS (
  SELECT outlet_id, sku, MIN(periode) AS min_periode, MAX(periode) AS max_periode
  FROM keys
  GROUP BY outlet_id, sku
),
periods AS (
  SELECT outlet_id, sku, min_periode AS periode, max_periode
  FROM bounds
  UNION ALL
  SELECT outlet_id, sku, (periode + interval '1 month')::date, max_periode
  FROM periods
  WHERE periode < max_periode
),
month_data AS (
  SELECT
    p.outlet_id,
    p.sku,
    p.periode,
    op.qty_awal,
    COALESCE(ms.qty_masuk, 0) AS stok_masuk,
    COALESCE(kl.qty_keluar, 0) AS stok_keluar,
    COALESCE(ad.qty_adjust, 0) AS penyesuaian
  FROM periods p
  LEFT JOIN opening op ON op.outlet_id = p.outlet_id AND op.sku = p.sku AND op.periode = p.periode
  LEFT JOIN masuk ms ON ms.outlet_id = p.outlet_id AND ms.sku = p.sku AND ms.periode = p.periode
  LEFT JOIN keluar kl ON kl.outlet_id = p.outlet_id AND kl.sku = p.sku AND kl.periode = p.periode
  LEFT JOIN adjust ad ON ad.outlet_id = p.outlet_id AND ad.sku = p.sku AND ad.periode = p.periode
),
rolling AS (
  SELECT
    md.outlet_id,
    md.sku,
    md.periode,
    COALESCE(md.qty_awal, 0) AS opening_stok,
    md.stok_masuk,
    md.stok_keluar,
    md.penyesuaian,
    COALESCE(md.qty_awal, 0) + md.stok_masuk - md.stok_keluar + md.penyesuaian AS stok_akhir
  FROM month_data md
  JOIN bounds b ON b.outlet_id = md.outlet_id AND b.sku = md.sku AND b.min_periode = md.periode

  UNION ALL

  SELECT
    md.outlet_id,
    md.sku,
    md.periode,
    COALESCE(md.qty_awal, r.stok_akhir) AS opening_stok,
    md.stok_masuk,
    md.stok_keluar,
    md.penyesuaian,
    COALESCE(md.qty_awal, r.stok_akhir) + md.stok_masuk - md.stok_keluar + md.penyesuaian AS stok_akhir
  FROM month_data md
  JOIN rolling r
    ON r.outlet_id = md.outlet_id
   AND r.sku = md.sku
   AND md.periode = (r.periode + interval '1 month')::date
)
SELECT
  o.nama_outlet,
  p.sku,
  p.nama_produk,
  r.periode,
  r.opening_stok,
  r.stok_masuk,
  r.stok_keluar,
  r.penyesuaian,
  r.stok_akhir
FROM rolling r
JOIN outlet o ON o.id = r.outlet_id
JOIN produk p ON p.sku = r.sku;

CREATE OR REPLACE VIEW vw_outlet_level_analysis AS
WITH level_sales AS (
  SELECT
    op.outlet_id,
    date_trunc('month', op.tanggal)::date AS periode,
    plm.level_code,
    SUM(op.qty) AS modul_keluar,
    SUM(plm.qty_per_siswa) AS mapping_qty
  FROM outlet_penjualan op
  JOIN produk_level_mapping plm
    ON plm.sku = op.sku
   AND plm.is_active = TRUE
  GROUP BY op.outlet_id, date_trunc('month', op.tanggal)::date, plm.level_code
),
level_targets AS (
  SELECT
    osm.outlet_id,
    osm.periode,
    osm.level_code,
    osm.jumlah_siswa,
    COALESCE(SUM(plm.qty_per_siswa), 0) AS qty_per_siswa_total
  FROM outlet_siswa_level_bulanan osm
  LEFT JOIN produk_level_mapping plm
    ON plm.level_code = osm.level_code
   AND plm.is_active = TRUE
  GROUP BY osm.outlet_id, osm.periode, osm.level_code, osm.jumlah_siswa
)
SELECT
  o.nama_outlet,
  t.periode,
  t.level_code,
  t.jumlah_siswa,
  COALESCE(s.modul_keluar, 0) AS modul_keluar,
  t.jumlah_siswa * t.qty_per_siswa_total AS target_modul,
  COALESCE(s.modul_keluar, 0) - (t.jumlah_siswa * t.qty_per_siswa_total) AS selisih,
  CASE
    WHEN COALESCE(s.modul_keluar, 0) = (t.jumlah_siswa * t.qty_per_siswa_total) THEN 'Sesuai'
    WHEN COALESCE(s.modul_keluar, 0) > (t.jumlah_siswa * t.qty_per_siswa_total) THEN 'Lebih'
    ELSE 'Kurang'
  END AS status
FROM level_targets t
JOIN outlet o ON o.id = t.outlet_id
LEFT JOIN level_sales s
  ON s.outlet_id = t.outlet_id
 AND s.periode = t.periode
 AND s.level_code = t.level_code;

COMMIT;

-- Setelah migrasi berhasil:
-- 1. Isi outlet_stok_awal untuk opening stock outlet per bulan
-- 2. Penjualan warehouse otomatis di-backfill ke outlet_stok_masuk
-- 3. Import penjualan outlet ke outlet_penjualan
-- 4. Isi mapping produk_level_mapping dan outlet_siswa_level_bulanan untuk analisis level siswa
