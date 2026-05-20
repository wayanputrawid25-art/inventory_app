import pool from "../services/db.js";

export default async function handler(req, res) {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    const { tanggal, items, checker, lokasi, keterangan } = req.body;

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

    await client.query("BEGIN");
    transactionStarted = true;

    // 1) HEADER
    const header = await client.query(`
      INSERT INTO stok_opname (tanggal, total_item, total_selisih, checker, lokasi, keterangan)
      VALUES ($1, $2, 0, $3, $4, $5)
      RETURNING id
    `, [tanggal, normalizedItems.length, checker || null, lokasi || null, keterangan || null]);

    const opnameId = header.rows[0].id;

    let totalSelisih = 0;
    let totalSelisihNet = 0;
    let totalItemSelisih = 0;

    // 2) DETAIL opname fisik saja, tanpa otomatis menyesuaikan stok.
    for (const it of normalizedItems) {
      const sku = it.sku;
      const sistem = it.sistem;
      const fisik = it.fisik;
      const selisih = fisik - sistem;

      totalSelisih += Math.abs(selisih);
      totalSelisihNet += selisih;
      if (selisih !== 0) totalItemSelisih += 1;

      // simpan detail fisik opname
      await client.query(`
        INSERT INTO stok_opname_detail
        (opname_id, sku, stok_sistem, stok_fisik, selisih, input_at)
        VALUES ($1,$2,$3,$4,$5,NOW())
      `, [opnameId, sku, sistem, fisik, selisih]);
    }

    // update total selisih di header
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

    await client.query("COMMIT");
    transactionStarted = false;

    res.json({ message: "Opname fisik tersimpan", opname_id: opnameId });

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
