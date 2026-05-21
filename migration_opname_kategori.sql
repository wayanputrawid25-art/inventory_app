-- Kategori target per perintah SO + indikator progres per kategori
ALTER TABLE stok_opname_perintah
  ADD COLUMN IF NOT EXISTS kategori_targets TEXT;

UPDATE stok_opname_perintah
SET kategori_targets = '["modul","seragam","poster","lain-lain"]'
WHERE kategori_targets IS NULL OR TRIM(kategori_targets) = '';
