import pool from "../services/db.js";

// V3 Chart - Chart data untuk Dashboard V3
export default async function handler(req, res) {
  try {
    const { bulan, tahun, type } = req.query;
    const now = new Date();
    const targetBulan = Number(bulan || now.getMonth() + 1);
    const targetTahun = Number(tahun || now.getFullYear());

    // Default type: 'overview'
    const chartType = type || 'overview';

    let result;

    switch (chartType) {
      case 'kategori':
        // Pie/Donut chart - Penjualan per kategori
        result = await pool.query(`
          SELECT 
            CASE
              WHEN UPPER(p.nama_produk) LIKE 'MODUL%' THEN 'Modul'
              WHEN UPPER(p.nama_produk) LIKE 'TAS%' THEN 'Tas'
              WHEN UPPER(p.nama_produk) LIKE 'BIRU%' 
                OR UPPER(p.nama_produk) LIKE 'KUNING%'
                OR UPPER(p.nama_produk) LIKE 'MERAH%' THEN 'Seragam'
              ELSE 'Lain-Lain'
            END AS label,
            COALESCE(SUM(j.qty), 0) AS value
          FROM produk p
          LEFT JOIN penjualan j ON j.sku = p.sku
            AND EXTRACT(MONTH FROM j.tanggal) = $1
            AND EXTRACT(YEAR FROM j.tanggal) = $2
          GROUP BY 
            CASE
              WHEN UPPER(p.nama_produk) LIKE 'MODUL%' THEN 'Modul'
              WHEN UPPER(p.nama_produk) LIKE 'TAS%' THEN 'Tas'
              WHEN UPPER(p.nama_produk) LIKE 'BIRU%' 
                OR UPPER(p.nama_produk) LIKE 'KUNING%'
                OR UPPER(p.nama_produk) LIKE 'MERAH%' THEN 'Seragam'
              ELSE 'Lain-Lain'
            END
          ORDER BY value DESC
        `, [targetBulan, targetTahun]);
        break;

      case 'level':
        // Bar chart - Penjualan per level modul
        result = await pool.query(`
          WITH produk_level AS (
            SELECT 
              sku,
              CASE
                WHEN nama_produk ILIKE 'Modul Membaca%' THEN 'Membaca'
                WHEN nama_produk ILIKE 'Modul Expro MD%' THEN 'Expro MD'
                WHEN nama_produk ILIKE 'Modul Expro PU%' THEN 'Expro PU'
                ELSE 'Lainnya'
              END AS modul_type,
              CASE
                WHEN nama_produk LIKE '%Level 1.%' THEN '1'
                WHEN nama_produk LIKE '%Level 2.%' THEN '2'
                WHEN nama_produk LIKE '%Level 3.%' THEN '3'
                WHEN nama_produk LIKE '%Level 4.%' THEN '4'
                ELSE '0'
              END AS level_num
            FROM produk
            WHERE nama_produk ILIKE 'Modul%'
          ),
          penjualan_level AS (
            SELECT 
              pl.modul_type,
              pl.level_num,
              COALESCE(SUM(j.qty), 0) AS value
            FROM produk_level pl
            LEFT JOIN penjualan j ON j.sku = pl.sku
              AND EXTRACT(MONTH FROM j.tanggal) = $1
              AND EXTRACT(YEAR FROM j.tanggal) = $2
            GROUP BY pl.sku, pl.modul_type, pl.level_num
          )
          SELECT 
            modul_type || ' Level ' || level_num AS label,
            SUM(value) AS value
          FROM penjualan_level
          WHERE modul_type != 'Lainnya'
          GROUP BY modul_type, level_num
          ORDER BY 
            CASE modul_type WHEN 'Membaca' THEN 1 WHEN 'Expro PU' THEN 2 WHEN 'Expro MD' THEN 3 ELSE 4 END,
            level_num
        `, [targetBulan, targetTahun]);
        break;

      case 'tren':
        // Line chart - Tren penjualan 12 bulan
        result = await pool.query(`
          SELECT 
            TO_CHAR(tanggal, 'Mon YYYY') AS label,
            EXTRACT(MONTH FROM tanggal) AS bulan,
            EXTRACT(YEAR FROM tanggal) AS tahun,
            COALESCE(SUM(qty), 0) AS value
          FROM penjualan
          WHERE tanggal >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY tanggal
          ORDER BY tanggal
        `);
        break;

      case 'stok':
        // Bar chart - Stok per kategori
        result = await pool.query(`
          WITH params AS (
            SELECT (make_date($2::int, $1::int, 1) + interval '1 month')::date AS end_date
          ),
          base_stock AS (
            SELECT 
              CASE
                WHEN UPPER(p.nama_produk) LIKE 'MODUL%' THEN 'Modul'
                WHEN UPPER(p.nama_produk) LIKE 'TAS%' THEN 'Tas'
                WHEN UPPER(p.nama_produk) LIKE 'BIRU%' 
                  OR UPPER(p.nama_produk) LIKE 'KUNING%'
                  OR UPPER(p.nama_produk) LIKE 'MERAH%' THEN 'Seragam'
                ELSE 'Lain-Lain'
              END AS kategori,
              COALESCE(SUM(sa.qty_awal), 0) AS stok_awal
            FROM produk p
            LEFT JOIN stok_awal sa ON sa.sku = p.sku
            GROUP BY kategori
          ),
          pembelian AS (
            SELECT 
              CASE
                WHEN UPPER(p.nama_produk) LIKE 'MODUL%' THEN 'Modul'
                WHEN UPPER(p.nama_produk) LIKE 'TAS%' THEN 'Tas'
                WHEN UPPER(p.nama_produk) LIKE 'BIRU%' 
                  OR UPPER(p.nama_produk) LIKE 'KUNING%'
                  OR UPPER(p.nama_produk) LIKE 'MERAH%' THEN 'Seragam'
                ELSE 'Lain-Lain'
              END AS kategori,
              COALESCE(SUM(pb.qty), 0) AS total_beli
            FROM produk p
            LEFT JOIN pembelian pb ON pb.sku = p.sku AND pb.tanggal <= (SELECT end_date FROM params)
            GROUP BY kategori
          ),
          penjualan AS (
            SELECT 
              CASE
                WHEN UPPER(p.nama_produk) LIKE 'MODUL%' THEN 'Modul'
                WHEN UPPER(p.nama_produk) LIKE 'TAS%' THEN 'Tas'
                WHEN UPPER(p.nama_produk) LIKE 'BIRU%' 
                  OR UPPER(p.nama_produk) LIKE 'KUNING%'
                  OR UPPER(p.nama_produk) LIKE 'MERAH%' THEN 'Seragam'
                ELSE 'Lain-Lain'
              END AS kategori,
              COALESCE(SUM(j.qty), 0) AS total_jual
            FROM produk p
            LEFT JOIN penjualan j ON j.sku = p.sku AND j.tanggal <= (SELECT end_date FROM params)
            GROUP BY kategori
          )
          SELECT 
            bs.kategori AS label,
            COALESCE(bs.stok_awal, 0) + COALESCE(pb.total_beli, 0) - COALESCE(pj.total_jual, 0) AS value
          FROM base_stock bs
          LEFT JOIN pembelian pb ON pb.kategori = bs.kategori
          LEFT JOIN penjualan pj ON pj.kategori = bs.kategori
          ORDER BY value DESC
        `, [targetBulan, targetTahun]);
        break;

      case 'outlet':
        // Top 10 outlet
        result = await pool.query(`
          SELECT 
            nama_outlet AS label,
            COALESCE(SUM(qty), 0) AS value
          FROM penjualan
          WHERE EXTRACT(MONTH FROM tanggal) = $1
            AND EXTRACT(YEAR FROM tanggal) = $2
          GROUP BY nama_outlet
          ORDER BY value DESC
          LIMIT 10
        `, [targetBulan, targetTahun]);
        break;

      default:
        // Overview - ringkasan chart
        result = await pool.query(`
          SELECT 
            'Penjualan' AS label,
            COALESCE(SUM(qty), 0) AS value
          FROM penjualan
          WHERE EXTRACT(MONTH FROM tanggal) = $1
            AND EXTRACT(YEAR FROM tanggal) = $2
          UNION ALL
          SELECT 
            'Pembelian' AS label,
            COALESCE(SUM(qty), 0) AS value
          FROM pembelian
          WHERE EXTRACT(MONTH FROM tanggal) = $1
            AND EXTRACT(YEAR FROM tanggal) = $2
        `, [targetBulan, targetTahun]);
    }

    res.status(200).json({
      type: chartType,
      periode: { bulan: targetBulan, tahun: targetTahun },
      data: result.rows.map(r => ({
        label: r.label,
        value: Number(r.value || 0)
      }))
    });

  } catch (err) {
    console.error("V3 CHART ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}