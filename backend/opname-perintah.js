import pool from "../services/db.js";

function normalizeKodeSo(value) {
  return String(value || "").trim().toUpperCase();
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { id, kode_so, bulan, tahun } = req.query;

      if (id || kode_so) {
        const result = await pool.query(
          `
          SELECT
            p.*,
            h.total_item,
            h.total_selisih,
            h.total_item_selisih,
            h.total_selisih_net
          FROM stok_opname_perintah p
          LEFT JOIN stok_opname h ON h.id = p.opname_id
          WHERE ${id ? "p.id = $1" : "UPPER(p.kode_so) = $1"}
          LIMIT 1
          `,
          [id ? Number(id) : normalizeKodeSo(kode_so)]
        );

        if (!result.rows.length) {
          return res.status(404).json({ error: "Perintah SO tidak ditemukan" });
        }

        return res.status(200).json(result.rows[0]);
      }

      if (!bulan || !tahun) {
        return res.status(400).json({ error: "bulan & tahun wajib" });
      }

      const listResult = await pool.query(
        `
        SELECT
          p.id,
          p.kode_so,
          p.tanggal_perintah,
          p.bulan,
          p.tahun,
          p.svp_nama,
          p.lokasi,
          p.keterangan,
          p.status,
          p.checker,
          p.opname_id,
          p.created_at,
          p.started_at,
          p.completed_at,
          h.total_item,
          h.total_selisih,
          h.total_item_selisih,
          h.total_selisih_net
        FROM stok_opname_perintah p
        LEFT JOIN stok_opname h ON h.id = p.opname_id
        WHERE p.bulan = $1 AND p.tahun = $2
        ORDER BY p.created_at DESC, p.kode_so ASC
        `,
        [Number(bulan), Number(tahun)]
      );

      return res.status(200).json(listResult.rows);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const action = String(body.action || "create").toLowerCase();

      if (action === "start") {
        const perintahId = Number(body.perintah_id);
        if (!perintahId) {
          return res.status(400).json({ error: "perintah_id wajib" });
        }

        const result = await pool.query(
          `
          UPDATE stok_opname_perintah
          SET
            status = 'proses',
            checker = COALESCE(NULLIF($2, ''), checker),
            started_at = COALESCE(started_at, NOW()),
            updated_at = NOW()
          WHERE id = $1 AND status IN ('menunggu', 'proses')
          RETURNING *
          `,
          [perintahId, body.checker || null]
        );

        if (!result.rows.length) {
          return res.status(404).json({ error: "Perintah SO tidak ditemukan atau sudah selesai" });
        }

        return res.status(200).json(result.rows[0]);
      }

      if (action === "update") {
        const perintahId = Number(body.perintah_id);
        const kodeSo = normalizeKodeSo(body.kode_so);
        const svpNama = String(body.svp_nama || "").trim();
        const lokasi = String(body.lokasi || "").trim() || null;
        const keterangan = String(body.keterangan || "").trim() || null;
        const tanggal = body.tanggal_perintah || body.tanggal;

        if (!perintahId) {
          return res.status(400).json({ error: "perintah_id wajib" });
        }
        if (!kodeSo || !svpNama || !tanggal) {
          return res.status(400).json({ error: "kode_so, svp_nama, dan tanggal wajib diisi" });
        }

        const dateObj = new Date(tanggal);
        if (Number.isNaN(dateObj.getTime())) {
          return res.status(400).json({ error: "Format tanggal tidak valid" });
        }

        const bulan = Number(body.bulan) || dateObj.getMonth() + 1;
        const tahun = Number(body.tahun) || dateObj.getFullYear();

        const existing = await pool.query(
          `SELECT id, status, kode_so FROM stok_opname_perintah WHERE id = $1`,
          [perintahId]
        );

        if (!existing.rows.length) {
          return res.status(404).json({ error: "Perintah SO tidak ditemukan" });
        }

        if (existing.rows[0].status === "selesai") {
          return res.status(400).json({ error: "Perintah yang sudah selesai tidak dapat diedit" });
        }

        const duplicate = await pool.query(
          `SELECT id FROM stok_opname_perintah WHERE UPPER(kode_so) = $1 AND id <> $2`,
          [kodeSo, perintahId]
        );

        if (duplicate.rows.length) {
          return res.status(409).json({ error: "Kode SO sudah digunakan perintah lain" });
        }

        const updateResult = await pool.query(
          `
          UPDATE stok_opname_perintah
          SET
            kode_so = $1,
            tanggal_perintah = $2,
            bulan = $3,
            tahun = $4,
            svp_nama = $5,
            lokasi = $6,
            keterangan = $7,
            updated_at = NOW()
          WHERE id = $8 AND status IN ('menunggu', 'proses')
          RETURNING *
          `,
          [kodeSo, tanggal, bulan, tahun, svpNama, lokasi, keterangan, perintahId]
        );

        if (!updateResult.rows.length) {
          return res.status(400).json({ error: "Perintah tidak dapat diperbarui" });
        }

        return res.status(200).json({
          message: `Perintah ${kodeSo} berhasil diperbarui`,
          perintah: updateResult.rows[0]
        });
      }

      const kodeSo = normalizeKodeSo(body.kode_so);
      const svpNama = String(body.svp_nama || "").trim();
      const lokasi = String(body.lokasi || "").trim() || null;
      const keterangan = String(body.keterangan || "").trim() || null;
      const tanggal = body.tanggal_perintah || body.tanggal;

      if (!kodeSo || !svpNama || !tanggal) {
        return res.status(400).json({ error: "kode_so, svp_nama, dan tanggal wajib diisi" });
      }

      const dateObj = new Date(tanggal);
      if (Number.isNaN(dateObj.getTime())) {
        return res.status(400).json({ error: "Format tanggal tidak valid" });
      }

      const bulan = Number(body.bulan) || dateObj.getMonth() + 1;
      const tahun = Number(body.tahun) || dateObj.getFullYear();

      const insertResult = await pool.query(
        `
        INSERT INTO stok_opname_perintah (
          kode_so, tanggal_perintah, bulan, tahun,
          svp_nama, lokasi, keterangan, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'menunggu')
        RETURNING *
        `,
        [kodeSo, tanggal, bulan, tahun, svpNama, lokasi, keterangan]
      );

      return res.status(201).json({
        message: `Perintah ${kodeSo} berhasil dibuat`,
        perintah: insertResult.rows[0]
      });
    }

    return res.status(405).json({ error: "Method tidak diizinkan" });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Kode SO sudah digunakan. Gunakan kode lain." });
    }
    console.error("OPNAME PERINTAH ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
