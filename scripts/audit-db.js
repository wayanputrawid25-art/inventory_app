import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL belum di-set!');
  console.error('Jalankan: export DATABASE_URL="postgresql://..."');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000
});

async function auditDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 FASE 1: AUDIT DATABASE NEON - CV EPIC WAREHOUSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. List all tables
    console.log('📋 DAFTAR SEMUA TABEL');
    console.log('─'.repeat(60));
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    tablesResult.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.table_name}`);
    });
    console.log(`\n  Total: ${tablesResult.rows.length} tabel\n`);

    // 2. Detailed table analysis
    console.log('📊 ANALISIS DETAIL SETIAP TABEL');
    console.log('═'.repeat(60));
    
    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;
      
      // Get columns
      const colsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      // Get row count
      const countResult = await client.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
      
      // Get primary key
      const pkResult = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
          AND tc.table_schema = 'public'
      `, [tableName]);

      // Get foreign keys
      const fkResult = await client.query(`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1
          AND tc.table_schema = 'public'
      `, [tableName]);

      console.log(`\n📌 TABEL: ${tableName}`);
      console.log(`   Baris Data: ${countResult.rows[0].cnt}`);
      console.log(`   Primary Key: ${pkResult.rows.map(r => r.column_name).join(', ') || 'TIDAK ADA'}`);
      
      if (fkResult.rows.length > 0) {
        console.log('   Foreign Keys:');
        fkResult.rows.forEach(fk => {
          console.log(`     - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }

      console.log('   Kolom:');
      colsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        const maxLen = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        console.log(`     • ${col.column_name}: ${col.data_type}${maxLen} ${nullable}${defaultVal}`);
      });
    }

    // 3. Sample data from key tables
    console.log('\n\n📝 SAMPLE DATA - PRODUK');
    console.log('═'.repeat(60));
    const produkResult = await client.query(`
      SELECT * FROM produk ORDER BY sku LIMIT 100
    `);
    const totalProduk = (await client.query('SELECT COUNT(*) FROM produk')).rows[0].count;
    console.log(`   Total produk di database: ${totalProduk}`);
    console.log('\n   Sample nama_produk:');
    produkResult.rows.slice(0, 50).forEach(p => {
      console.log(`     - ${p.sku || p.kode_barang || 'N/A'}: ${p.nama_produk || p.nama_barang || 'N/A'}`);
    });

    // 4. Check views
    console.log('\n\n👁️ VIEW YANG TERSEDIA');
    console.log('─'.repeat(60));
    const viewsResult = await client.query(`
      SELECT table_name FROM information_schema.views
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    if (viewsResult.rows.length === 0) {
      console.log('   (Tidak ada view)');
    } else {
      viewsResult.rows.forEach(v => {
        console.log(`  • ${v.table_name}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AUDIT DATABASE SELESAI');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

auditDatabase();