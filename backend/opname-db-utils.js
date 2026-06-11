import pool from "../services/db.js";

let cachedColumns = null;

export async function getStokOpnameColumns() {
  if (cachedColumns) return cachedColumns;

  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stok_opname'
      AND column_name = ANY($1::text[])
  `, [["created_at", "updated_at", "total_item_selisih", "total_selisih_net", "disesuaikan_at"]]);

  cachedColumns = new Set(result.rows.map((row) => row.column_name));
  return cachedColumns;
}

export function clearStokOpnameColumnsCache() {
  cachedColumns = null;
}

export async function ensureStokOpnameDisesuaikanColumn() {
  await pool.query(`
    ALTER TABLE stok_opname
      ADD COLUMN IF NOT EXISTS disesuaikan_at TIMESTAMP
  `);
  clearStokOpnameColumnsCache();
}

export function buildOpnamePenyesuaianRef(opnameId, kodeSo = "") {
  const kode = String(kodeSo || "").trim() || "SO";
  return `Stok Opname ${kode} [opname:${Number(opnameId)}]`;
}

export function buildOpnamePenyesuaianRefPattern(opnameId) {
  return `%[opname:${Number(opnameId)}]%`;
}
