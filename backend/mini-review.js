import pool from "../services/db.js";

export default async function handler(req, res) {
  try {
    const { bulan, tahun } = req.query;
    const year = Number(tahun || new Date().getFullYear());
    const month = Number(bulan || new Date().getMonth() + 1);

    const result = await pool.query(
      `
      WITH grouped_products AS (
        SELECT
          CASE
            WHEN p.nama_produk ILIKE 'Modul Membaca Level 1.%' THEN 'Modul Membaca Level 1'
            WHEN p.nama_produk ILIKE 'Modul Membaca Level 2.%' THEN 'Modul Membaca Level 2'
            WHEN p.nama_produk ILIKE 'Modul Membaca Level 3.%' THEN 'Modul Membaca Level 3'
            WHEN p.nama_produk ILIKE 'Modul Expro PU Level 1.%' THEN 'Modul Expro PU Level 1'
            WHEN p.nama_produk ILIKE 'Modul Expro PU Level 2.%' THEN 'Modul Expro PU Level 2'
            WHEN p.nama_produk ILIKE 'Modul Expro MD Level 1.%' THEN 'Modul Expro MD Level 1'
            WHEN p.nama_produk ILIKE 'Modul Expro MD Level 2.%' THEN 'Modul Expro MD Level 2'
            WHEN p.nama_produk ILIKE 'Modul Expro MD Level 3.%' THEN 'Modul Expro MD Level 3'
            WHEN p.nama_produk ILIKE 'Modul Expro MD Level 4.%' THEN 'Modul Expro MD Level 4'
            WHEN p.nama_produk ILIKE '%tas%' THEN 'Tas'
            ELSE NULL
          END AS grouping,
          j.qty
        FROM penjualan j
        JOIN produk p ON p.sku = j.sku
        WHERE j.tanggal >= make_date($2::int, $1::int, 1)
          AND j.tanggal < (make_date($2::int, $1::int, 1) + interval '1 month')::date
          AND (
            p.nama_produk ILIKE 'Modul Membaca Level 1.%'
            OR p.nama_produk ILIKE 'Modul Membaca Level 2.%'
            OR p.nama_produk ILIKE 'Modul Membaca Level 3.%'
            OR p.nama_produk ILIKE 'Modul Expro PU Level 1.%'
            OR p.nama_produk ILIKE 'Modul Expro PU Level 2.%'
            OR p.nama_produk ILIKE 'Modul Expro MD Level 1.%'
            OR p.nama_produk ILIKE 'Modul Expro MD Level 2.%'
            OR p.nama_produk ILIKE 'Modul Expro MD Level 3.%'
            OR p.nama_produk ILIKE 'Modul Expro MD Level 4.%'
            OR p.nama_produk ILIKE '%tas%'
          )
      )
      SELECT
        grouping,
        COALESCE(SUM(qty), 0) AS total
      FROM grouped_products
      WHERE grouping IS NOT NULL
      GROUP BY grouping
      ORDER BY
        CASE
          WHEN grouping = 'Modul Membaca Level 1' THEN 1
          WHEN grouping = 'Modul Membaca Level 2' THEN 2
          WHEN grouping = 'Modul Membaca Level 3' THEN 3
          WHEN grouping = 'Modul Expro PU Level 1' THEN 4
          WHEN grouping = 'Modul Expro PU Level 2' THEN 5
          WHEN grouping = 'Modul Expro MD Level 1' THEN 6
          WHEN grouping = 'Modul Expro MD Level 2' THEN 7
          WHEN grouping = 'Modul Expro MD Level 3' THEN 8
          WHEN grouping = 'Modul Expro MD Level 4' THEN 9
          WHEN grouping = 'Tas' THEN 10
          ELSE 99
        END
      `,
      [month, year]
    );

    const groups = [
      'Modul Membaca Level 1',
      'Modul Membaca Level 2',
      'Modul Membaca Level 3',
      'Modul Expro PU Level 1',
      'Modul Expro PU Level 2',
      'Modul Expro MD Level 1',
      'Modul Expro MD Level 2',
      'Modul Expro MD Level 3',
      'Modul Expro MD Level 4'
    ];

    const grouped = Object.fromEntries(result.rows.map(row => [row.grouping, Number(row.total || 0)]));
    const modul = groups.map(level => ({
      level,
      total: grouped[level] || 0
    }));

    const tasTotal = Number(grouped['Tas'] || 0);

    res.status(200).json({ modul, tas_total: tasTotal });
  } catch (err) {
    console.error("MINI REVIEW ERROR:", err);
    const message = err?.message || "Terjadi error saat mengambil data mini review.";
    const isDbError = err?.code === 'ECONNREFUSED' || message.includes('DATABASE_URL');

    if (isDbError) {
      return res.status(200).json({
        modul: [],
        tas_total: 0,
        message: "Database tidak tersedia. Periksa konfigurasi DATABASE_URL dan koneksi PostgreSQL."
      });
    }

    res.status(500).json({ error: message });
  }
}
