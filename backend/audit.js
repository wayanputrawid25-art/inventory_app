import pool from "../services/db.js";

async function getTableAvailability() {
  const result = await pool.query(`
    SELECT
      to_regclass('public.outlet_stok_awal') IS NOT NULL AS has_outlet_stok_awal,
      to_regclass('public.outlet_stok_masuk') IS NOT NULL AS has_outlet_stok_masuk,
      to_regclass('public.outlet_penjualan') IS NOT NULL AS has_outlet_penjualan,
      to_regclass('public.outlet_stok_penyesuaian') IS NOT NULL AS has_outlet_stok_penyesuaian,
      to_regclass('public.outlet_stok_opname') IS NOT NULL AS has_outlet_stok_opname,
      to_regclass('public.produk_level_mapping') IS NOT NULL AS has_produk_level_mapping,
      to_regclass('public.outlet_siswa_level_bulanan') IS NOT NULL AS has_outlet_siswa_level_bulanan,
      to_regclass('public.vw_outlet_stock_monthly') IS NOT NULL AS has_outlet_stock_view,
      to_regclass('public.vw_outlet_level_analysis') IS NOT NULL AS has_outlet_level_analysis_view
  `);

  return result.rows[0] || {};
}

function sumBy(rows, field) {
  return rows.reduce((sum, item) => sum + Number(item?.[field] || 0), 0);
}

function buildFallbackFlags(rows) {
  return rows.map(item => ({
    ...item,
    flag: "DB_OUTLET_BELUM_LENGKAP",
    detail: "Stok outlet belum memakai rolling stock penuh karena tabel audit outlet baru belum selesai di-migrasi."
  }));
}

export default async function handler(req, res) {
  try {
    const { bulan, tahun, sku, outlet, section = "overview" } = req.query;
    const availability = await getTableAvailability();
    const stockReady = Boolean(
      availability.has_outlet_stok_awal
      && availability.has_outlet_stok_masuk
      && availability.has_outlet_penjualan
      && availability.has_outlet_stok_penyesuaian
      && availability.has_outlet_stock_view
    );
    const analysisReady = Boolean(
      availability.has_produk_level_mapping
      && availability.has_outlet_siswa_level_bulanan
      && availability.has_outlet_level_analysis_view
    );
    const dbReady = stockReady && analysisReady;
    const needsSummary = section === "overview";
    const needsOutlet = section === "outlet";
    const needsLog = section === "log";
    const needsControl = section === "control";
    const needsIntegration = section === "integration";
    const needsAnalysis = section === "overview";

    if (dbReady) {
      const [summaryResult, outletResult, movementResult, flagResult, analysisResult] = await Promise.all([
        needsSummary ? pool.query(`
          WITH params AS (
            SELECT
              make_date($2::int, $1::int, 1) AS start_date,
              (make_date($2::int, $1::int, 1) + interval '1 month')::date AS end_date
          ),
          movement_union AS (
            SELECT outlet_id, qty, 'warehouse_transfer' AS jenis
            FROM outlet_stok_masuk
            WHERE tanggal >= (SELECT start_date FROM params)
              AND tanggal < (SELECT end_date FROM params)
              AND ($3::text = '' OR sku = $3)
              AND ($4::text = '' OR outlet_id IN (SELECT id FROM outlet WHERE nama_outlet = $4))
            UNION ALL
            SELECT outlet_id, qty, 'outlet_sales' AS jenis
            FROM outlet_penjualan
            WHERE tanggal >= (SELECT start_date FROM params)
              AND tanggal < (SELECT end_date FROM params)
              AND ($3::text = '' OR sku = $3)
              AND ($4::text = '' OR outlet_id IN (SELECT id FROM outlet WHERE nama_outlet = $4))
            UNION ALL
            SELECT outlet_id, ABS(qty) AS qty, 'adjustment' AS jenis
            FROM outlet_stok_penyesuaian
            WHERE tanggal >= (SELECT start_date FROM params)
              AND tanggal < (SELECT end_date FROM params)
              AND ($3::text = '' OR sku = $3)
              AND ($4::text = '' OR outlet_id IN (SELECT id FROM outlet WHERE nama_outlet = $4))
          ),
          stock_problem_outlets AS (
            SELECT DISTINCT nama_outlet
            FROM vw_outlet_stock_monthly
            WHERE periode = (SELECT start_date FROM params)
              AND ($3::text = '' OR sku = $3)
              AND ($4::text = '' OR nama_outlet = $4)
              AND (
                stok_akhir < 0
                OR (stok_keluar = 0 AND stok_masuk > 0 AND stok_akhir > 0)
                OR ABS(penyesuaian) > GREATEST(stok_masuk * 0.25, 10)
              )
          ),
          level_problem_outlets AS (
            SELECT DISTINCT nama_outlet
            FROM vw_outlet_level_analysis
            WHERE periode = (SELECT start_date FROM params)
              AND ($4::text = '' OR nama_outlet = $4)
              AND (
                $3::text = ''
                OR level_code IN (
                  SELECT level_code
                  FROM produk_level_mapping
                  WHERE sku = $3
                )
              )
              AND selisih <> 0
          ),
          problem_outlets AS (
            SELECT nama_outlet FROM stock_problem_outlets
            UNION
            SELECT nama_outlet FROM level_problem_outlets
          )
          SELECT
            COALESCE((SELECT COUNT(*) FROM movement_union), 0) AS total_mutasi,
            COALESCE((SELECT SUM(qty) FROM movement_union WHERE jenis = 'warehouse_transfer'), 0) AS stok_masuk_outlet,
            COALESCE((SELECT SUM(qty) FROM movement_union WHERE jenis = 'outlet_sales'), 0) AS penjualan_outlet,
            COALESCE((SELECT SUM(qty) FROM movement_union), 0) AS qty_bergerak,
            COALESCE((
              SELECT COUNT(DISTINCT nama_outlet)
              FROM vw_outlet_stock_monthly
              WHERE periode = (SELECT start_date FROM params)
                AND ($3::text = '' OR sku = $3)
                AND ($4::text = '' OR nama_outlet = $4)
            ), 0) AS total_outlet,
            COALESCE((SELECT COUNT(*) FROM problem_outlets), 0) AS problem_outlet
        `, [bulan, tahun, sku || "", outlet || ""]) : Promise.resolve({ rows: [] }),
        needsOutlet ? pool.query(`
          WITH params AS (
            SELECT make_date($2::int, $1::int, 1) AS start_date
          )
          SELECT
            nama_outlet,
            sku,
            nama_produk,
            opening_stok,
            stok_masuk,
            stok_keluar,
            penyesuaian,
            stok_akhir
          FROM vw_outlet_stock_monthly
          WHERE periode = (SELECT start_date FROM params)
            AND ($3::text = '' OR sku = $3)
            AND ($4::text = '' OR nama_outlet = $4)
          ORDER BY nama_outlet, nama_produk
        `, [bulan, tahun, sku || "", outlet || ""]) : Promise.resolve({ rows: [] }),
        needsLog ? pool.query(`
          WITH params AS (
            SELECT
              make_date($2::int, $1::int, 1) AS start_date,
              (make_date($2::int, $1::int, 1) + interval '1 month')::date AS end_date
          )
          SELECT *
          FROM (
            SELECT
              m.tanggal,
              'Warehouse' AS sumber,
              'Stok Masuk Outlet' AS jenis,
              o.nama_outlet,
              m.sku,
              m.qty,
              COALESCE(m.ref_penjualan_id::text, '-') AS referensi,
              COALESCE(m.keterangan, '-') AS keterangan
            FROM outlet_stok_masuk m
            JOIN outlet o ON o.id = m.outlet_id
            WHERE m.tanggal >= (SELECT start_date FROM params)
              AND m.tanggal < (SELECT end_date FROM params)
              AND ($3::text = '' OR m.sku = $3)
              AND ($4::text = '' OR o.nama_outlet = $4)

            UNION ALL

            SELECT
              s.tanggal,
              'Outlet' AS sumber,
              'Penjualan Outlet' AS jenis,
              o.nama_outlet,
              s.sku,
              s.qty,
              '-' AS referensi,
              COALESCE(s.keterangan, '-') AS keterangan
            FROM outlet_penjualan s
            JOIN outlet o ON o.id = s.outlet_id
            WHERE s.tanggal >= (SELECT start_date FROM params)
              AND s.tanggal < (SELECT end_date FROM params)
              AND ($3::text = '' OR s.sku = $3)
              AND ($4::text = '' OR o.nama_outlet = $4)

            UNION ALL

            SELECT
              a.tanggal,
              'Audit' AS sumber,
              'Penyesuaian' AS jenis,
              o.nama_outlet,
              a.sku,
              a.qty,
              '-' AS referensi,
              COALESCE(a.alasan, '-') AS keterangan
            FROM outlet_stok_penyesuaian a
            JOIN outlet o ON o.id = a.outlet_id
            WHERE a.tanggal >= (SELECT start_date FROM params)
              AND a.tanggal < (SELECT end_date FROM params)
              AND ($3::text = '' OR a.sku = $3)
              AND ($4::text = '' OR o.nama_outlet = $4)
          ) movement_log
          ORDER BY tanggal DESC, nama_outlet
          LIMIT 500
        `, [bulan, tahun, sku || "", outlet || ""]) : Promise.resolve({ rows: [] }),
        needsControl ? pool.query(`
          WITH params AS (
            SELECT make_date($2::int, $1::int, 1) AS start_date
          ),
          stock_flags AS (
            SELECT
              nama_outlet,
              sku,
              CASE
                WHEN stok_akhir < 0 THEN 'STOK_MINUS'
                WHEN stok_keluar = 0 AND stok_masuk > 0 AND stok_akhir > 0 THEN 'STOK_ADA_TAPI_TIDAK_TERJUAL'
                WHEN ABS(penyesuaian) > GREATEST(stok_masuk * 0.25, 10) THEN 'PENYESUAIAN_TIDAK_WAJAR'
              END AS flag,
              CASE
                WHEN stok_akhir < 0 THEN 'Stok rolling outlet minus pada bulan ini. Periksa input stok awal, penjualan outlet, atau penyesuaian.'
                WHEN stok_keluar = 0 AND stok_masuk > 0 AND stok_akhir > 0 THEN 'Stok rolling outlet masih ada tetapi belum ada penjualan outlet tercatat.'
                WHEN ABS(penyesuaian) > GREATEST(stok_masuk * 0.25, 10) THEN 'Penyesuaian outlet terlalu besar dibanding stok masuk bulan berjalan.'
              END AS detail
            FROM vw_outlet_stock_monthly
            WHERE periode = (SELECT start_date FROM params)
              AND ($3::text = '' OR sku = $3)
              AND ($4::text = '' OR nama_outlet = $4)
              AND (
                stok_akhir < 0
                OR (stok_keluar = 0 AND stok_masuk > 0 AND stok_akhir > 0)
                OR ABS(penyesuaian) > GREATEST(stok_masuk * 0.25, 10)
              )
          ),
          analysis_flags AS (
            SELECT
              nama_outlet,
              '-' AS sku,
              'SELISIH_LEVEL_SISWA' AS flag,
              CONCAT('Level ', level_code, ': modul keluar ', modul_keluar, ' vs target ', target_modul, ' (selisih ', selisih, ').') AS detail
            FROM vw_outlet_level_analysis
            WHERE periode = (SELECT start_date FROM params)
              AND ($4::text = '' OR nama_outlet = $4)
              AND (
                $3::text = ''
                OR level_code IN (
                  SELECT level_code
                  FROM produk_level_mapping
                  WHERE sku = $3
                )
              )
              AND selisih <> 0
          )
          SELECT * FROM stock_flags
          UNION ALL
          SELECT * FROM analysis_flags
          ORDER BY nama_outlet, sku, flag
        `, [bulan, tahun, sku || "", outlet || ""]) : Promise.resolve({ rows: [] }),
        needsAnalysis && analysisReady
          ? pool.query(`
              WITH params AS (
                SELECT make_date($2::int, $1::int, 1) AS start_date
              )
              SELECT
                nama_outlet,
                level_code,
                jumlah_siswa,
                modul_keluar,
                target_modul,
                selisih,
                status
              FROM vw_outlet_level_analysis
              WHERE periode = (SELECT start_date FROM params)
                AND ($4::text = '' OR nama_outlet = $4)
                AND (
                  $3::text = ''
                  OR level_code IN (
                    SELECT level_code
                    FROM produk_level_mapping
                    WHERE sku = $3
                  )
                )
              ORDER BY nama_outlet, level_code
            `, [bulan, tahun, sku || "", outlet || ""])
          : Promise.resolve({ rows: [] })
      ]);

      return res.status(200).json({
        db_ready: true,
        ...(needsSummary ? { summary: summaryResult.rows[0] || {} } : {}),
        ...(needsOutlet ? { outlet_summary: outletResult.rows } : {}),
        ...(needsLog ? { movements: movementResult.rows } : {}),
        ...(needsControl ? { flags: flagResult.rows } : {}),
        ...(needsAnalysis ? { analysis: analysisResult.rows } : {}),
        ...(needsIntegration ? {
          notes: [
            "Penjualan warehouse ke outlet sekarang harus dimirror ke outlet_stok_masuk pada tanggal yang sama.",
            "Opening outlet cukup diisi saat awal setup atau ketika ada koreksi. Bulan berikutnya akan memakai rolling closing bulan sebelumnya.",
            "Stok keluar outlet dibaca langsung dari tabel outlet_penjualan agar audit tidak bercampur dengan penjualan warehouse.",
            "Analisis level siswa memakai produk_level_mapping dan outlet_siswa_level_bulanan per outlet per bulan."
          ]
        } : {})
      });
    }

    const [summaryResult, outletResult, movementResult] = await Promise.all([
      needsSummary ? pool.query(`
        WITH params AS (
          SELECT
            make_date($2::int, $1::int, 1) AS start_date,
            (make_date($2::int, $1::int, 1) + interval '1 month')::date AS end_date
        ),
        movement_union AS (
          SELECT tanggal, qty, 'warehouse_transfer' AS jenis
          FROM penjualan
          WHERE tanggal >= (SELECT start_date FROM params)
            AND tanggal < (SELECT end_date FROM params)
            AND ($3::text = '' OR sku = $3)
            AND ($4::text = '' OR nama_outlet = $4)
          UNION ALL
          SELECT tanggal, qty, 'warehouse_purchase' AS jenis
          FROM pembelian
          WHERE tanggal >= (SELECT start_date FROM params)
            AND tanggal < (SELECT end_date FROM params)
            AND ($3::text = '' OR sku = $3)
            AND $4::text = ''
        )
        SELECT
          COUNT(*) AS total_mutasi,
          COALESCE(SUM(CASE WHEN jenis = 'warehouse_transfer' THEN qty ELSE 0 END), 0) AS stok_masuk_outlet,
          0 AS penjualan_outlet,
          COALESCE(SUM(qty), 0) AS qty_bergerak,
          (SELECT COUNT(DISTINCT nama_outlet) FROM penjualan
            WHERE tanggal >= (SELECT start_date FROM params)
              AND tanggal < (SELECT end_date FROM params)
              AND ($4::text = '' OR nama_outlet = $4)
          ) AS total_outlet,
          0 AS problem_outlet
        FROM movement_union
      `, [bulan, tahun, sku || "", outlet || ""]) : Promise.resolve({ rows: [] }),
      needsOutlet ? pool.query(`
        WITH params AS (
          SELECT
            make_date($2::int, $1::int, 1) AS start_date,
            (make_date($2::int, $1::int, 1) + interval '1 month')::date AS end_date
        ),
        transfer_before AS (
          SELECT nama_outlet, sku, COALESCE(SUM(qty), 0) AS qty
          FROM penjualan
          WHERE tanggal < (SELECT start_date FROM params)
            AND ($4::text = '' OR nama_outlet = $4)
          GROUP BY nama_outlet, sku
        ),
        transfer_month AS (
          SELECT nama_outlet, sku, COALESCE(SUM(qty), 0) AS qty
          FROM penjualan
          WHERE tanggal >= (SELECT start_date FROM params)
            AND tanggal < (SELECT end_date FROM params)
            AND ($4::text = '' OR nama_outlet = $4)
          GROUP BY nama_outlet, sku
        ),
        keys AS (
          SELECT nama_outlet, sku FROM transfer_before
          UNION
          SELECT nama_outlet, sku FROM transfer_month
        )
        SELECT
          k.nama_outlet,
          p.sku,
          p.nama_produk,
          COALESCE(tb.qty, 0) AS opening_stok,
          COALESCE(tm.qty, 0) AS stok_masuk,
          0 AS stok_keluar,
          0 AS penyesuaian,
          COALESCE(tb.qty, 0) + COALESCE(tm.qty, 0) AS stok_akhir
        FROM keys k
        JOIN produk p ON p.sku = k.sku
        LEFT JOIN transfer_before tb ON tb.nama_outlet = k.nama_outlet AND tb.sku = k.sku
        LEFT JOIN transfer_month tm ON tm.nama_outlet = k.nama_outlet AND tm.sku = k.sku
        WHERE ($3::text = '' OR p.sku = $3)
          AND ($4::text = '' OR k.nama_outlet = $4)
        ORDER BY k.nama_outlet, p.nama_produk
      `, [bulan, tahun, sku || "", outlet || ""]) : Promise.resolve({ rows: [] }),
      needsLog ? pool.query(`
        WITH params AS (
          SELECT
            make_date($2::int, $1::int, 1) AS start_date,
            (make_date($2::int, $1::int, 1) + interval '1 month')::date AS end_date
        )
        SELECT *
        FROM (
          SELECT
            tanggal,
            'Warehouse' AS sumber,
            'Transfer ke Outlet' AS jenis,
            nama_outlet,
            sku,
            qty,
            '-' AS referensi,
            'Penjualan warehouse saat ini diperlakukan sebagai stok masuk outlet' AS keterangan
          FROM penjualan
          WHERE tanggal >= (SELECT start_date FROM params)
            AND tanggal < (SELECT end_date FROM params)
            AND ($3::text = '' OR sku = $3)
            AND ($4::text = '' OR nama_outlet = $4)

          UNION ALL

          SELECT
            tanggal,
            'Warehouse' AS sumber,
            'Pembelian Warehouse' AS jenis,
            '-' AS nama_outlet,
            sku,
            qty,
            '-' AS referensi,
            'Masuk ke stok gudang' AS keterangan
          FROM pembelian
          WHERE tanggal >= (SELECT start_date FROM params)
            AND tanggal < (SELECT end_date FROM params)
            AND ($3::text = '' OR sku = $3)
            AND $4::text = ''
        ) movement_log
        ORDER BY tanggal DESC
        LIMIT 300
      `, [bulan, tahun, sku || "", outlet || ""]) : Promise.resolve({ rows: [] })
    ]);

    const flags = buildFallbackFlags(outletResult.rows || [])
      .filter(item => Number(item.stok_akhir || 0) > 0)
      .slice(0, 50);

    return res.status(200).json({
      db_ready: false,
      ...(needsSummary ? { summary: summaryResult.rows[0] || {} } : {}),
      ...(needsOutlet ? { outlet_summary: outletResult.rows } : {}),
      ...(needsLog ? { movements: movementResult.rows } : {}),
      ...(needsControl ? { flags } : {}),
      ...(needsAnalysis ? { analysis: [] } : {}),
      ...(needsIntegration ? {
        notes: [
          "Jalankan migration_neon_safe.sql agar rolling stock outlet dan analisis level siswa aktif.",
          "Penjualan warehouse perlu dimirror ke outlet_stok_masuk agar stok masuk outlet otomatis tercatat.",
          "Siapkan outlet_stok_awal, outlet_penjualan, produk_level_mapping, dan outlet_siswa_level_bulanan untuk audit penuh."
        ]
      } : {})
    });
  } catch (err) {
    console.error("AUDIT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
