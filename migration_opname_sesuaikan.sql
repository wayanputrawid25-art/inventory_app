-- Flag & timestamp when opname results are applied to stok_penyesuaian
ALTER TABLE stok_opname
  ADD COLUMN IF NOT EXISTS disesuaikan_at TIMESTAMP;
