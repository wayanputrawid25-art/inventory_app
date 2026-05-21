import pool from "../services/db.js";
import {
  buildOpnamePenyesuaianRef,
  buildOpnamePenyesuaianRefPattern,
  ensureStokOpnameDisesuaikanColumn,
  getStokOpnameColumns
} from "./opname-db-utils.js";

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function handler(req, res) {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method tidak diizinkan" });
    }

    const opnameId = Number(req.body?.opname_id);
    if (!opnameId) {
      return res.status(400).json({ error: "opname_id wajib" });
    }

    await ensureStokOpnameDisesuaikanColumn();
    const columns = await getStokOpnameColumns();
    const disesuaikanSelect = columns.has("disesuaikan_at") ? "h.disesuaikan_at" : "NULL::timestamp AS disesuaikan_at";

    const headerResult = await client.query(
      `
      SELECT
        h.id,
        h.tanggal,
        ${disesuaikanSelect},
        p.kode_so
      FROM stok_opname h
      LEFT JOIN stok_opname_perintah p ON p.opname_id = h.id
      WHERE h.id = $1
      `,
      [opnameId]
    );

    if (!headerResult.rows.length) {
      return res.status(404).json({ error: "Hasil opname tidak ditemukan" });
    }

    const header = headerResult.rows[0];
    if (header.disesuaikan_at) {
      return res.status(400).json({ error: "Stok untuk hasil opname ini sudah disesuaikan sebelumnya" });
    }

    const detailResult = await client.query(
      `
      SELECT sku, selisih
      FROM stok_opname_detail
      WHERE opname_id = $1 AND selisih <> 0
      ORDER BY id
      `,
      [opnameId]
    );

    if (!detailResult.rows.length) {
      return res.status(400).json({ error: "Tidak ada selisih untuk disesuaikan. Stok sudah seimbang." });
    }

    const tanggal = getTodayDateString();
    const keteranganRef = buildOpnamePenyesuaianRef(opnameId, header.kode_so);
    const refPattern = buildOpnamePenyesuaianRefPattern(opnameId);

    await client.query("BEGIN");
    transactionStarted = true;

    await client.query(
      `DELETE FROM stok_penyesuaian WHERE keterangan LIKE $1`,
      [refPattern]
    );

    for (const row of detailResult.rows) {
      await client.query(
        `
        INSERT INTO stok_penyesuaian (tanggal, sku, qty, keterangan)
        VALUES ($1, $2, $3, $4)
        `,
        [tanggal, row.sku, Number(row.selisih), keteranganRef]
      );
    }

    if (columns.has("disesuaikan_at")) {
      const updatedAtSql = columns.has("updated_at") ? ", updated_at = NOW()" : "";
      await client.query(
        `
        UPDATE stok_opname
        SET disesuaikan_at = NOW()
        ${updatedAtSql}
        WHERE id = $1
        `,
        [opnameId]
      );
    }

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(200).json({
      message: `Penyesuaian stok ${header.kode_so || `OPNAME-${opnameId}`} berhasil diterapkan (${detailResult.rows.length} item)`,
      opname_id: opnameId,
      items_adjusted: detailResult.rows.length,
      tanggal_penyesuaian: tanggal
    });
  } catch (err) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    console.error("SESUAIKAN OPNAME ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}
