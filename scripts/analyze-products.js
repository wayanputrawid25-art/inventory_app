import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_NHY3t7qdiVAL@ep-super-glade-a1izmh9v-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function analyzeProducts() {
  const client = await pool.connect();
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 FASE 3: ANALISIS PRODUK - CV EPIC WAREHOUSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Get ALL products
    const produk = await client.query(`
      SELECT sku, nama_produk, harga_beli, harga_jual 
      FROM produk 
      ORDER BY nama_produk
    `);
    
    console.log(`📊 TOTAL PRODUK: ${produk.rows.length}\n`);

    // 2. Analyze patterns from nama_produk
    console.log('📋 ANALISIS POLA NAMA PRODUK');
    console.log('─'.repeat(60));
    
    const patterns = {
      'MODUL': [],
      'TAS': [],
      'BIRU': [],
      'KUNING': [],
      'MERAH': [],
      'LAIN-LAIN': []
    };

    produk.rows.forEach(p => {
      const nama = (p.nama_produk || '').toUpperCase();
      if (nama.startsWith('MODUL')) {
        patterns['MODUL'].push(p.nama_produk);
      } else if (nama.startsWith('TAS')) {
        patterns['TAS'].push(p.nama_produk);
      } else if (nama.startsWith('BIRU')) {
        patterns['BIRU'].push(p.nama_produk);
      } else if (nama.startsWith('KUNING')) {
        patterns['KUNING'].push(p.nama_produk);
      } else if (nama.startsWith('MERAH')) {
        patterns['MERAH'].push(p.nama_produk);
      } else {
        patterns['LAIN-LAIN'].push(p.nama_produk);
      }
    });

    // Display pattern counts
    let totalMapped = 0;
    Object.entries(patterns).forEach(([kategori, items]) => {
      if (items.length > 0) {
        console.log(`\n【${kategori}】 - ${items.length} produk`);
        items.slice(0, 15).forEach(n => console.log(`   • ${n}`));
        if (items.length > 15) {
          console.log(`   ... dan ${items.length - 15} produk lainnya`);
        }
        totalMapped += items.length;
      }
    });

    console.log(`\n\n📊 RINGKASAN KATEGORI:`);
    console.log('─'.repeat(60));
    console.log(`   MODUL: ${patterns['MODUL'].length} produk`);
    console.log(`   TAS: ${patterns['TAS'].length} produk`);
    console.log(`   SERAGAM (BIRU): ${patterns['BIRU'].length} produk`);
    console.log(`   SERAGAM (KUNING): ${patterns['KUNING'].length} produk`);
    console.log(`   SERAGAM (MERAH): ${patterns['MERAH'].length} produk`);
    console.log(`   LAIN-LAIN: ${patterns['LAIN-LAIN'].length} produk`);
    console.log(`   TOTAL: ${totalMapped} produk`);

    // 3. Analyze MODUL levels
    console.log('\n\n📊 ANALISIS LEVEL MODUL');
    console.log('─'.repeat(60));
    
    const modulProduk = produk.rows.filter(p => (p.nama_produk || '').toUpperCase().startsWith('MODUL'));
    const levelGroups = {};
    
    modulProduk.forEach(p => {
      const nama = p.nama_produk || '';
      const levelMatch = nama.match(/LEVEL\s*(\d+)\.(\d+)/i);
      if (levelMatch) {
        const typeMatch = nama.match(/MODUL\s+(EXPRO\s+\w+)/i);
        const type = typeMatch ? typeMatch[1].toUpperCase() : 'MEMBACA';
        const level = levelMatch[1];
        if (!levelGroups[type]) levelGroups[type] = {};
        if (!levelGroups[type][level]) levelGroups[type][level] = [];
        levelGroups[type][level].push(nama);
      }
    });

    Object.entries(levelGroups).forEach(([type, levels]) => {
      console.log(`\n  ${type}:`);
      Object.entries(levels).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).forEach(([level, items]) => {
        console.log(`    Level ${level}: ${items.length} varian - contoh: ${items[0]}`);
      });
    });

    // 4. List all Lain-Lain products
    console.log('\n\n📋 PRODUK LAIN-LAIN (Tidak termasuk MODUL, TAS, atau SERAGAM):');
    console.log('─'.repeat(60));
    patterns['LAIN-LAIN'].forEach(n => console.log(`   • ${n}`));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ANALISIS PRODUK SELESAI');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeProducts();