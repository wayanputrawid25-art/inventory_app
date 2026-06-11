import pool from "../services/db.js";

// V3 Penjualan - Analisis dari database dengan kategori dan level
export default async function handler(req, res) {
  try {
    const { bulan, tahun, kategori, level } = req.query;
    const now = new Date();
    const targetBulan = Number(bulan || now.getMonth() + 1);
    const targetTahun = Number(tahun || now.getFullYear());

    // 1. Penjualan Harian (periode ini)
    const penjualanHarian = await pool.query(`
      SELECT 
        tanggal,
        COUNT(*) AS transaksi,
        COALESCE(SUM(qty), 0) AS total_qty
      FROM penjualan
      WHERE EXTRACT(MONTH FROM tanggal) = $1
        AND EXTRACT(YEAR FROM tanggal) = $2
      GROUP BY tanggal
      ORDER BY tanggal DESC
      LIMIT 30
    `, [targetBulan, targetTahun]);

    // 2. Penjualan Bulanan (12 bulan terakhir)
    const penjualanBulanan = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM tanggal) AS bulan,
        EXTRACT(YEAR FROM tanggal) AS tahun,
        COALESCE(SUM(qty), 0) AS total_qty,
        COUNT(DISTINCT nama_outlet) AS customer_count
      FROM penjualan
      WHERE tanggal >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(MONTH FROM tanggal), EXTRACT(YEAR FROM tanggal)
      ORDER BY tahun, bulan
    `);

    // 3. Penjualan per Produk
    const penjualanProduk = await pool.query(`
      SELECT 
        p.sku,
        p.nama_produk,
        COALESCE(SUM(j.qty), 0) AS total_qty
      FROM produk p
      LEFT JOIN penjualan j ON j.sku = p.sku
        AND EXTRACT(MONTH FROM j.tanggal) = $1
        AND EXTRACT(YEAR FROM j.tanggal) = $2
      GROUP BY p.sku, p.nama_produk
      HAVING COALESCE(SUM(j.qty), 0) > 0
      ORDER BY total_qty DESC
      LIMIT 50
    `, [targetBulan, targetTahun]);

    // 4. Penjualan per Customer/Outlet
    const penjualanCustomer = await pool.query(`
      SELECT 
        nama_outlet,
        COUNT(*) AS transaksi,
        COALESCE(SUM(qty), 0) AS total_qty
      FROM penjualan
      WHERE EXTRACT(MONTH FROM tanggal) = $1
        AND EXTRACT(YEAR FROM tanggal) = $2
      GROUP BY nama_outlet
      ORDER BY total_qty DESC
      LIMIT 50
    `, [targetBulan, targetTahun]);

    // 5. Analisis Kategori (MODUL, TAS, SERAGAM, LAIN-LAIN)
    // Kategori formed from nama_produk patterns - NOT hardcoded
    const analisisKategori = await pool.query(`
      SELECT 
        CASE
          WHEN UPPER(p.nama_produk) LIKE 'MODUL%' THEN 'modul'
          WHEN UPPER(p.nama_produk) LIKE 'TAS%' THEN 'tas'
          WHEN UPPER(p.nama_produk) LIKE 'BIRU%' 
            OR UPPER(p.nama_produk) LIKE 'KUNING%'
            OR UPPER(p.nama_produk) LIKE 'MERAH%' THEN 'seragam'
          ELSE 'lain_lain'
        END AS kategori,
        COALESCE(SUM(j.qty), 0) AS total_qty,
        COUNT(DISTINCT p.sku) AS total_sku,
        COUNT(DISTINCT j.nama_outlet) AS total_customer
      FROM produk p
      LEFT JOIN penjualan j ON j.sku = p.sku
        AND EXTRACT(MONTH FROM j.tanggal) = $1
        AND EXTRACT(YEAR FROM j.tanggal) = $2
      GROUP BY 
        CASE
          WHEN UPPER(p.nama_produk) LIKE 'MODUL%' THEN 'modul'
          WHEN UPPER(p.nama_produk) LIKE 'TAS%' THEN 'tas'
          WHEN UPPER(p.nama_produk) LIKE 'BIRU%' 
            OR UPPER(p.nama_produk) LIKE 'KUNING%'
            OR UPPER(p.nama_produk) LIKE 'MERAH%' THEN 'seragam'
          ELSE 'lain_lain'
        END
      ORDER BY total_qty DESC
    `, [targetBulan, targetTahun]);

    // 6. Analisis Level (untuk MODUL saja)
    // Level extracted from nama_produk pattern "Level X.Y"
    // Simplified query without complex GROUP BY CASE
    const analisisLevel = await pool.query(`
      WITH produk_level AS (
        SELECT 
          sku,
          nama_produk,
          CASE
            WHEN nama_produk ILIKE 'Modul Membaca%' THEN 'Membaca'
            WHEN nama_produk ILIKE 'Modul Expro MD%' THEN 'Expro MD'
            WHEN nama_produk ILIKE 'Modul Expro PU%' THEN 'Expro PU'
            ELSE 'Lainnya'
          END AS modul_type,
          -- Extract level number manually
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
          pl.sku,
          pl.modul_type,
          pl.level_num,
          COALESCE(SUM(j.qty), 0) AS total_qty
        FROM produk_level pl
        LEFT JOIN penjualan j ON j.sku = pl.sku
          AND EXTRACT(MONTH FROM j.tanggal) = $1
          AND EXTRACT(YEAR FROM j.tanggal) = $2
        GROUP BY pl.sku, pl.modul_type, pl.level_num
      )
      SELECT 
        modul_type,
        level_num,
        SUM(total_qty) AS total_qty,
        COUNT(*) AS total_sku
      FROM penjualan_level
      WHERE modul_type != 'Lainnya'
      GROUP BY modul_type, level_num
      ORDER BY 
        CASE modul_type WHEN 'Membaca' THEN 1 WHEN 'Expro PU' THEN 2 WHEN 'Expro MD' THEN 3 ELSE 4 END,
        level_num
    `, [targetBulan, targetTahun]);

    // 7. Ringkasan periode
    const ringkasanPeriode = await pool.query(`
      SELECT 
        COALESCE(SUM(qty), 0) AS total_penjualan,
        COUNT(DISTINCT sku) AS produk_terjual,
        COUNT(DISTINCT nama_outlet) AS customer_terlayani
      FROM penjualan
      WHERE EXTRACT(MONTH FROM tanggal) = $1
        AND EXTRACT(YEAR FROM tanggal) = $2
    `, [targetBulan, targetTahun]);

    const result = {
      periode: {
        bulan: targetBulan,
        tahun: targetTahun
      },
      ringkasan: {
        total_penjualan: Number(ringkasanPeriode.rows[0]?.total_penjualan || 0),
        produk_terjual: Number(ringkasanPeriode.rows[0]?.produk_terjual || 0),
        customer_terlayani: Number(ringkasanPeriode.rows[0]?.customer_terlayani || 0)
      },
      harian: penjualanHarian.rows.map(r => ({
        tanggal: r.tanggal,
        transaksi: Number(r.transaksi || 0),
        qty: Number(r.total_qty || 0)
      })),
      bulanan: penjualanBulanan.rows.map(r => ({
        bulan: Number(r.bulan),
        tahun: Number(r.tahun),
        qty: Number(r.total_qty || 0),
        customer_count: Number(r.customer_count || 0)
      })),
      produk: penjualanProduk.rows.map(r => ({
        sku: r.sku,
        nama_produk: r.nama_produk,
        qty: Number(r.total_qty || 0)
      })),
      customer: penjualanCustomer.rows.map(r => ({
        nama_outlet: r.nama_outlet,
        transaksi: Number(r.transaksi || 0),
        qty: Number(r.total_qty || 0)
      })),
      kategori: analisisKategori.rows.map(r => ({
        kategori: r.kategori,
        label: r.kategori === 'modul' ? 'Modul' 
             : r.kategori === 'tas' ? 'Tas'
             : r.kategori === 'seragam' ? 'Seragam'
             : 'Lain-Lain',
        qty: Number(r.total_qty || 0),
        total_sku: Number(r.total_sku || 0),
        total_customer: Number(r.total_customer || 0)
      })),
      level: analisisLevel.rows.map(r => ({
        modul_type: r.modul_type,
        level: r.level_num,
        qty: Number(r.total_qty || 0),
        total_sku: Number(r.total_sku || 0)
      })),
      generated_at: new Date().toISOString()
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("V3 PENJUALAN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}