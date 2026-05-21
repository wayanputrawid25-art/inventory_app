import pool from "../services/db.js";
import { getStokOpnameColumns } from "./opname-db-utils.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { bulan, tahun, opname_id } = req.query;
      const columns = await getStokOpnameColumns();
      const extraSelect = [
        columns.has("total_item_selisih") ? "h.total_item_selisih" : "0 AS total_item_selisih",
        columns.has("total_selisih_net") ? "h.total_selisih_net" : "0 AS total_selisih_net",
        columns.has("disesuaikan_at") ? "h.disesuaikan_at" : "NULL::timestamp AS disesuaikan_at"
      ].join(",\n            ");
      const createdAtSelect = columns.has("created_at") ? "h.created_at" : "h.tanggal AS created_at";

      if (opname_id) {
        const detailResult = await pool.query(`
          SELECT 
            h.id,
            h.tanggal,
            h.checker,
            h.lokasi,
            h.total_item,
            h.total_selisih,
            ${extraSelect},
            ${createdAtSelect},
            d.sku,
            p.nama_produk,
            d.stok_sistem,
            d.stok_fisik,
            d.selisih,
            d.input_at
          FROM stok_opname h
          LEFT JOIN stok_opname_detail d ON h.id = d.opname_id
          LEFT JOIN produk p ON p.sku = d.sku
          WHERE h.id = $1
          ORDER BY d.id
        `, [opname_id]);

        if (!detailResult.rows.length) {
          return res.status(404).json({ error: "Stok Opname tidak ditemukan" });
        }

        const header = detailResult.rows[0];
        const details = detailResult.rows
          .filter((row) => row.sku)
          .map((row) => ({
            sku: row.sku,
            nama_produk: row.nama_produk,
            stok_sistem: row.stok_sistem,
            stok_fisik: row.stok_fisik,
            selisih: row.selisih
          }));

        return res.status(200).json({
          header: {
            id: header.id,
            tanggal: header.tanggal,
            checker: header.checker,
            lokasi: header.lokasi,
            total_item: header.total_item,
            total_selisih: header.total_selisih,
            total_item_selisih: header.total_item_selisih,
            total_selisih_net: header.total_selisih_net,
            created_at: header.created_at,
            disesuaikan_at: header.disesuaikan_at,
            stok_disesuaikan: Boolean(header.disesuaikan_at)
          },
          details
        });
      }

      const listExtraSelect = [
        columns.has("total_item_selisih") ? "total_item_selisih" : "0 AS total_item_selisih",
        columns.has("total_selisih_net") ? "total_selisih_net" : "0 AS total_selisih_net"
      ].join(",\n          ");
      const listCreatedAt = columns.has("created_at") ? "created_at" : "tanggal AS created_at";
      const listOrder = columns.has("created_at") ? "tanggal DESC, created_at DESC" : "tanggal DESC, id DESC";

      const result = await pool.query(`
        SELECT 
          id,
          tanggal,
          checker,
          lokasi,
          total_item,
          total_selisih,
          ${listExtraSelect},
          ${listCreatedAt}
        FROM stok_opname
        WHERE 1=1
          ${bulan ? "AND EXTRACT(MONTH FROM tanggal) = $1" : ""}
          ${tahun ? `AND EXTRACT(YEAR FROM tanggal) = ${bulan ? "$2" : "$1"}` : ""}
        ORDER BY ${listOrder}
      `, bulan && tahun ? [bulan, tahun] : (bulan ? [bulan] : (tahun ? [tahun] : [])));

      return res.status(200).json(result.rows);
    }

    res.status(405).json({ error: "Method tidak diizinkan" });
  } catch (err) {
    console.error("Stok Opname Export ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
