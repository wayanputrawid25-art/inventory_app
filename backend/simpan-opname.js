import pool from "../services/db.js";
import {
  buildOpnamePenyesuaianRefPattern,
  ensureStokOpnameDisesuaikanColumn,
  getStokOpnameColumns
} from "./opname-db-utils.js";

export default async function handler(req, res) {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    const { tanggal, items, checker, lokasi, keterangan, perintah_id } = req.body;
    const partial = Boolean(req.body?.partial);

    if (!perintah_id) {
      return res.status(400).json({ error: "perintah_id wajib. Pilih perintah SO dari tab Hasil SO terlebih dahulu." });
    }

    if (!tanggal || !Array.isArray(items)) {
      return res.status(400).json({ error: "Payload tidak valid" });
    }

    const normalizedItems = items
      .map((item) => ({
        sku: String(item?.sku || "").trim(),
        sistem: Number(item?.sistem ?? 0),
        fisik: Number(item?.fisik ?? 0)
      }))
      .filter((item) => item.sku && Number.isFinite(item.sistem) && Number.isFinite(item.fisik));

    if (!normalizedItems.length) {
      return res.status(400).json({ error: "Tidak ada item opname yang valid" });
    }

    const perintahResult = await client.query(
      `SELECT id, kode_so, status, opname_id FROM stok_opname_perintah WHERE id = $1`,
      [Number(perintah_id)]
    );

    if (!perintahResult.rows.length) {
      return res.status(404).json({ error: "Perintah SO tidak ditemukan" });
    }

    const perintah = perintahResult.rows[0];
    const isUpdate = Boolean(perintah.opname_id);

    const skuList = [...new Set(normalizedItems.map((item) => item.sku))];
    const produkResult = await client.query(
      "SELECT sku FROM produk WHERE sku = ANY($1::text[])",
      [skuList]
    );
    const validSku = new Set(produkResult.rows.map((row) => row.sku));
    const missingSku = skuList.filter((sku) => !validSku.has(sku));

    if (missingSku.length) {
      return res.status(400).json({
        error: "Sebagian SKU tidak ditemukan di master produk",
        missing_sku: missingSku
      });
    }

    await ensureStokOpnameDisesuaikanColumn();
    const opnameColumns = await getStokOpnameColumns();

    await client.query("BEGIN");
    transactionStarted = true;

    let opnameId = perintah.opname_id ? Number(perintah.opname_id) : null;

    if (isUpdate) {
      await client.query(
        `DELETE FROM stok_penyesuaian WHERE keterangan LIKE $1`,
        [buildOpnamePenyesuaianRefPattern(opnameId)]
      );

      const clearDisesuaikanSql = opnameColumns.has("disesuaikan_at")
        ? ", disesuaikan_at = NULL"
        : "";
      const updatedAtOnClear = opnameColumns.has("updated_at") ? ", updated_at = NOW()" : "";

      await client.query(`
        UPDATE stok_opname
        SET
          tanggal = $1,
          total_item = $2,
          checker = $3,
          lokasi = $4,
          keterangan = $5
          ${clearDisesuaikanSql}
          ${updatedAtOnClear}
        WHERE id = $6
      `, [tanggal, normalizedItems.length, checker || null, lokasi || null, keterangan || null, opnameId]);

      await client.query(`DELETE FROM stok_opname_detail WHERE opname_id = $1`, [opnameId]);
    } else {
      const header = await client.query(`
        INSERT INTO stok_opname (tanggal, total_item, total_selisih, checker, lokasi, keterangan, perintah_id)
        VALUES ($1, $2, 0, $3, $4, $5, $6)
        RETURNING id
      `, [tanggal, normalizedItems.length, checker || null, lokasi || null, keterangan || null, perintah.id]);

      opnameId = header.rows[0].id;
    }

    let totalSelisih = 0;
    let totalSelisihNet = 0;
    let totalItemSelisih = 0;

    for (const it of normalizedItems) {
      const sku = it.sku;
      const sistem = it.sistem;
      const fisik = it.fisik;
      const selisih = fisik - sistem;

      totalSelisih += Math.abs(selisih);
      totalSelisihNet += selisih;
      if (selisih !== 0) totalItemSelisih += 1;

      await client.query(`
        INSERT INTO stok_opname_detail
        (opname_id, sku, stok_sistem, stok_fisik, selisih, input_at)
        VALUES ($1,$2,$3,$4,$5,NOW())
      `, [opnameId, sku, sistem, fisik, selisih]);
    }

    await client.query(`
      UPDATE stok_opname
      SET total_selisih = $1
      WHERE id = $2
    `, [totalSelisih, opnameId]);

    const columnResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'stok_opname'
        AND column_name = ANY($1::text[])
    `, [["total_item_selisih", "total_selisih_net", "updated_at"]]);

    const columns = new Set(columnResult.rows.map((row) => row.column_name));
    if (columns.has("total_item_selisih") && columns.has("total_selisih_net")) {
      const updatedAtSql = columns.has("updated_at") ? ", updated_at = NOW()" : "";
      await client.query(`
        UPDATE stok_opname
        SET
          total_item_selisih = $1,
          total_selisih_net = $2
          ${updatedAtSql}
        WHERE id = $3
      `, [totalItemSelisih, totalSelisihNet, opnameId]);
    }

    const perintahStatusSql = partial ? "status = 'proses'," : "status = 'selesai',";
    const completedAtSql = partial ? "completed_at = NULL," : "completed_at = COALESCE(completed_at, NOW()),";

    await client.query(`
      UPDATE stok_opname_perintah
      SET
        ${perintahStatusSql}
        checker = COALESCE($2, checker),
        lokasi = COALESCE($3, lokasi),
        opname_id = $4,
        ${completedAtSql}
        updated_at = NOW()
      WHERE id = $1
    `, [perintah.id, checker || null, lokasi || null, opnameId]);

    await client.query("COMMIT");
    transactionStarted = false;

    res.json({
      message: isUpdate
        ? `Hasil ${perintah.kode_so} berhasil diperbarui (dicatat, belum menyesuaikan stok)`
        : `Hasil ${perintah.kode_so} berhasil dicatat. Gunakan tombol Sesuaikan untuk menyesuaikan stok.`,
      opname_id: opnameId,
      perintah_id: perintah.id,
      kode_so: perintah.kode_so,
      stok_disesuaikan: false
    });

  } catch (err) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    console.error("SIMPAN OPNAME ERROR:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}
