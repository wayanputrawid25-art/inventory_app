import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_NHY3t7qdiVAL@ep-super-glade-a1izmh9v-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function analyzeUsers() {
  const client = await pool.connect();
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 ANALISIS USER & ROLE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const users = await client.query(`
      SELECT id, username, email, role, is_active, last_login, created_at
      FROM users
      ORDER BY role, username
    `);

    console.log(`📊 TOTAL USER: ${users.rows.length}\n`);
    
    console.log('📋 DAFTAR USER:');
    console.log('─'.repeat(60));
    users.rows.forEach(u => {
      console.log(`\n  ID: ${u.id}`);
      console.log(`  Username: ${u.username}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  Aktif: ${u.is_active ? 'Ya' : 'Tidak'}`);
      console.log(`  Login Terakhir: ${u.last_login || 'Belum pernah'}`);
    });

    console.log('\n\n📊 RINGKASAN ROLE:');
    console.log('─'.repeat(60));
    const roleCount = {};
    users.rows.forEach(u => {
      roleCount[u.role] = (roleCount[u.role] || 0) + 1;
    });
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} user`);
    });

    console.log('\n\n📋 OUTLET/GERAI:');
    console.log('─'.repeat(60));
    const outlets = await client.query(`
      SELECT id, nama_outlet, created_at
      FROM outlet
      ORDER BY nama_outlet
    `);
    console.log(`  Total Outlet: ${outlets.rows.length}`);
    outlets.rows.slice(0, 10).forEach(o => {
      console.log(`  • ${o.nama_outlet} (ID: ${o.id})`);
    });
    if (outlets.rows.length > 10) {
      console.log(`  ... dan ${outlets.rows.length - 10} outlet lainnya`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ANALISIS USER & ROLE SELESAI');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeUsers();