import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { Client } from 'pg';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_PATH = path.resolve(__dirname, '..', 'database_schema_mysql_complete.sql');

const DEFAULTS = {
  admin: {
    username: 'admin',
    email: 'admin@localhost',
    password: 'Admin123!',
    nama_lengkap: 'Administrator',
    role: 'admin'
  },
  kategori: 'Umum',
  supplier: 'Umum'
};

const dryRun = process.argv.includes('--dry-run');
const schemaOnly = process.argv.includes('--schema-only');

function log(...args) {
  console.log('[migrate-db]', ...args);
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50) || 'OUTLET';
}

function generateWerkzeugPasswordHash(password, iterations = 260000) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2:sha256:${iterations}$${salt}$${derived}`;
}

function getMySqlConfig() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'app_user';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'cv_epic_warehouse_mysql';

  if (!database) {
    throw new Error('DB_NAME must be set in .env');
  }

  return { host, port, user, password, database, multipleStatements: true };
}

function getPgConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set in .env');
  }
  return { connectionString };
}

async function queryPg(pg, sql, params = []) {
  const result = await pg.query(sql, params);
  return result.rows;
}

async function queryMy(mysqlConn, sql, params = []) {
  const [rows] = await mysqlConn.execute(sql, params);
  return rows;
}

async function execMy(mysqlConn, sql, params = []) {
  if (dryRun) {
    log('[dry-run] exec', sql, params);
    return null;
  }
  const [result] = await mysqlConn.execute(sql, params);
  return result;
}

async function ensureDefaultEntity(mysqlConn, table, searchField, searchValue, insertFields) {
  const rows = await queryMy(mysqlConn, `SELECT id FROM ${table} WHERE ${searchField} = ? LIMIT 1`, [searchValue]);
  if (rows.length > 0) {
    return rows[0].id;
  }

  const columns = insertFields.map((field) => field.name).join(', ');
  const values = insertFields.map(() => '?').join(', ');
  const params = insertFields.map((field) => field.value);
  const result = await execMy(mysqlConn, `INSERT INTO ${table} (${columns}) VALUES (${values})`, params);
  return result?.insertId;
}

async function ensureInitialAdmin(mysqlConn) {
  const [rows] = await mysqlConn.execute('SELECT id FROM users WHERE username = ? LIMIT 1', [DEFAULTS.admin.username]);
  if (rows.length > 0) {
    log('Existing admin user found with id', rows[0].id);
    return rows[0].id;
  }

  const hash = generateWerkzeugPasswordHash(DEFAULTS.admin.password);
  const insertFields = [
    { name: 'username', value: DEFAULTS.admin.username },
    { name: 'email', value: DEFAULTS.admin.email },
    { name: 'password_hash', value: hash },
    { name: 'nama_lengkap', value: DEFAULTS.admin.nama_lengkap },
    { name: 'role', value: DEFAULTS.admin.role },
    { name: 'is_active', value: 1 },
    { name: 'created_at', value: new Date() },
    { name: 'updated_at', value: new Date() }
  ];

  const result = await execMy(mysqlConn, `INSERT INTO users (${insertFields.map((f) => f.name).join(', ')}) VALUES (${insertFields.map(() => '?').join(', ')})`, insertFields.map((f) => f.value));
  if (result?.insertId) {
    log(`Created default admin user '${DEFAULTS.admin.username}' with temporary password '${DEFAULTS.admin.password}'`);
  }
  return result?.insertId;
}

async function migrateSchema(mysqlConn) {
  log('Loading MySQL schema from', SCHEMA_PATH);
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  if (dryRun) {
    log('[dry-run] Schema loaded, skipping execution');
    return;
  }
  log('Applying MySQL schema...');
  await mysqlConn.query(sql);
  log('Schema applied.');
}

async function migrateOutlets(pg, mysqlConn) {
  const outlets = await queryPg(pg, 'SELECT id, nama_outlet, created_at FROM outlet ORDER BY id');
  const outletMap = new Map();

  for (const row of outlets) {
    const nome = String(row.nama_outlet || 'Unknown Outlet').trim();
    const kode = `${slugify(nome)}_${row.id}`;
    const existing = await queryMy(mysqlConn, 'SELECT id FROM outlets WHERE nama_outlet = ? LIMIT 1', [nome]);
    if (existing.length > 0) {
      outletMap.set(row.id, existing[0].id);
      continue;
    }

    const params = [row.id, nome, kode, null, null, null, null, 1, row.created_at || new Date(), new Date()];
    const result = await execMy(mysqlConn, 'INSERT INTO outlets (id, nama_outlet, kode_outlet, alamat, kota, no_telp, manager_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', params);
    const assignedId = result?.insertId || row.id;
    outletMap.set(row.id, assignedId);
  }

  log(`Migrated ${outletMap.size} outlet records.`);
  return outletMap;
}

async function migrateProducts(pg, mysqlConn, kategoriId, supplierId, adminId) {
  const products = await queryPg(pg, 'SELECT sku, nama_produk, harga_beli, harga_jual FROM produk ORDER BY sku');
  let imported = 0;

  for (const item of products) {
    const kodeBarang = item.sku;
    if (!kodeBarang) continue;
    const namaBarang = String(item.nama_produk || item.sku).trim();

    const insertParams = [
      kodeBarang,
      namaBarang,
      kategoriId,
      supplierId,
      null,
      item.harga_beli ?? 0,
      item.harga_jual ?? 0,
      10,
      100,
      'pcs',
      null,
      1,
      new Date(),
      new Date(),
      adminId
    ];

    await execMy(mysqlConn,
      `INSERT INTO produk (kode_barang, nama_barang, kategori_id, supplier_id, deskripsi, harga_beli, harga_jual, min_stok, max_stok, satuan, berat_gram, is_active, created_at, updated_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nama_barang = VALUES(nama_barang), harga_beli = VALUES(harga_beli), harga_jual = VALUES(harga_jual), updated_at = VALUES(updated_at)`,
      insertParams);
    imported += 1;
  }

  log(`Migrated ${imported} produk records.`);
}

async function migrateSimpleTable(pg, mysqlConn, tableName, columns, transforms = {}) {
  let rows = [];
  try {
    rows = await queryPg(pg, `SELECT ${columns.join(', ')} FROM ${tableName} ORDER BY id`);
  } catch (err) {
    log(`Skipping missing source table ${tableName}`);
    return 0;
  }

  let count = 0;
  for (const row of rows) {
    const values = columns.map((column) => {
      if (typeof transforms[column] === 'function') {
        return transforms[column](row[column], row);
      }
      return row[column];
    });
    const placeholders = values.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    await execMy(mysqlConn, sql, values);
    count += 1;
  }

  log(`Migrated ${count} records into ${tableName}.`);
  return count;
}

async function migratePenjualanAsOutletPenjualan(pg, mysqlConn, outletMap) {
  let rows = [];
  try {
    rows = await queryPg(pg, 'SELECT id, tanggal, nama_outlet, sku, qty, created_at FROM penjualan ORDER BY id');
  } catch (err) {
    log('Skipping source table penjualan because it is missing');
    return 0;
  }

  const [existingCountRows] = await mysqlConn.execute('SELECT COUNT(*) AS count FROM outlet_penjualan');
  const existingCount = existingCountRows[0]?.count || 0;
  if (existingCount > 0) {
    log('Skipping penjualan->outlet_penjualan migration because outlet_penjualan already contains data.');
    return 0;
  }

  let count = 0;
  for (const row of rows) {
    const matchingOutlet = await queryMy(mysqlConn, 'SELECT id FROM outlets WHERE UPPER(TRIM(nama_outlet)) = UPPER(TRIM(?)) LIMIT 1', [row.nama_outlet]);
    const resolvedOutletId = matchingOutlet.length ? matchingOutlet[0].id : null;

    if (!resolvedOutletId) {
      log(`Skipping penjualan row ${row.id}: outlet '${row.nama_outlet}' not found in target outlets`);
      continue;
    }

    const params = [row.tanggal, resolvedOutletId, row.sku, row.qty ?? 0, 'sales_outlet', null, row.created_at || null];
    await execMy(mysqlConn, 'INSERT INTO outlet_penjualan (tanggal, outlet_id, sku, qty, sumber, keterangan, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?)', params);
    count += 1;
  }

  log(`Migrated ${count} penjualan rows into outlet_penjualan.`);
  return count;
}

async function migrateOutletAuditTables(pg, mysqlConn, outletMap) {
  const mappings = [
    {
      source: 'outlet_stok_awal',
      target: 'outlet_stok_awal',
      columns: ['outlet_id', 'sku', 'periode', 'qty_awal', 'created_at'],
      transform: {
        outlet_id: (value) => value
      }
    },
    {
      source: 'outlet_stok_masuk',
      target: 'outlet_stok_masuk',
      columns: ['tanggal', 'outlet_id', 'sku', 'qty', 'sumber', 'ref_penjualan_id', 'keterangan', 'checker', 'created_at'],
      transform: {
        outlet_id: (value) => value
      }
    },
    {
      source: 'outlet_penjualan',
      target: 'outlet_penjualan',
      columns: ['tanggal', 'outlet_id', 'sku', 'qty', 'sumber', 'keterangan', 'imported_at'],
      transform: {
        outlet_id: (value) => value
      }
    },
    {
      source: 'outlet_stok_penyesuaian',
      target: 'outlet_stok_penyesuaian',
      columns: ['tanggal', 'outlet_id', 'sku', 'qty', 'alasan', 'checker', 'approved_by', 'created_at'],
      transform: {
        outlet_id: (value) => value
      }
    },
    {
      source: 'outlet_stok_opname',
      target: 'outlet_stok_opname',
      columns: ['tanggal', 'outlet_id', 'total_item', 'total_selisih', 'checker', 'approved_by', 'keterangan', 'created_at'],
      transform: {
        outlet_id: (value) => value
      }
    },
    {
      source: 'outlet_stok_opname_detail',
      target: 'outlet_stok_opname_detail',
      columns: ['opname_id', 'sku', 'stok_sistem', 'stok_fisik', 'selisih'],
      transform: {
        opname_id: (value) => value
      }
    }
  ];

  for (const entry of mappings) {
    try {
      const rows = await queryPg(pg, `SELECT ${entry.columns.join(', ')} FROM ${entry.source} ORDER BY id`);
      let count = 0;
      for (const row of rows) {
        const values = entry.columns.map((column) => {
          return typeof entry.transform?.[column] === 'function' ? entry.transform[column](row[column], row) : row[column];
        });
        await execMy(mysqlConn, `INSERT INTO ${entry.target} (${entry.columns.join(', ')}) VALUES (${values.map(() => '?').join(', ')})`, values);
        count += 1;
      }
      log(`Migrated ${count} rows from ${entry.source} to ${entry.target}.`);
    } catch (error) {
      log(`Skipping source table ${entry.source}: ${error.message}`);
    }
  }
}

async function migrateStokOpname(pg, mysqlConn) {
  const opnameRows = await queryPg(pg, 'SELECT id, tanggal, total_item, total_selisih, checker, lokasi, keterangan, created_at FROM stok_opname ORDER BY id');
  let saved = 0;

  for (const header of opnameRows) {
    const [result] = dryRun ? [{ insertId: header.id }] : await mysqlConn.execute(
      'INSERT INTO stok_opname (id, tanggal, total_item, total_selisih, checker, lokasi, keterangan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [header.id, header.tanggal, header.total_item ?? 0, header.total_selisih ?? 0, header.checker, header.lokasi, header.keterangan, header.created_at || null]
    );
    const newId = dryRun ? header.id : result.insertId;

    const details = await queryPg(pg, 'SELECT sku, stok_sistem, stok_fisik, selisih, input_at FROM stok_opname_detail WHERE opname_id = $1 ORDER BY id', [header.id]);
    for (const row of details) {
      await execMy(mysqlConn, 'INSERT INTO stok_opname_detail (opname_id, sku, stok_sistem, stok_fisik, selisih, input_at) VALUES (?, ?, ?, ?, ?, ?)',
        [newId, row.sku, row.stok_sistem ?? 0, row.stok_fisik ?? 0, row.selisih ?? 0, row.input_at || null]);
    }
    saved += 1;
  }

  log(`Migrated ${saved} stok_opname header records with details.`);
}

async function run() {
  const pgConfig = getPgConfig();
  const mysqlConfig = getMySqlConfig();

  log('Postgres source:', pgConfig.connectionString.replace(/(password=)[^\s]+/, '$1***'));
  log('MySQL target:', `${mysqlConfig.user}@${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`);

  const pg = new Client(pgConfig);
  const mysqlConn = await mysql.createConnection(mysqlConfig);

  try {
    await pg.connect();
    if (schemaOnly) {
      await migrateSchema(mysqlConn);
      return;
    }

    await migrateSchema(mysqlConn);
    if (dryRun) {
      log('Dry run active: data writes are skipped.');
    }

    const adminId = await ensureInitialAdmin(mysqlConn);
    const kategoriId = await ensureDefaultEntity(mysqlConn, 'kategori', 'nama_kategori', DEFAULTS.kategori, [
      { name: 'nama_kategori', value: DEFAULTS.kategori },
      { name: 'deskripsi', value: 'Kategori default untuk data migrasi' },
      { name: 'is_active', value: 1 },
      { name: 'created_at', value: new Date() },
      { name: 'updated_at', value: new Date() }
    ]);
    const supplierId = await ensureDefaultEntity(mysqlConn, 'supplier', 'nama_supplier', DEFAULTS.supplier, [
      { name: 'nama_supplier', value: DEFAULTS.supplier },
      { name: 'no_telp', value: '' },
      { name: 'email', value: '' },
      { name: 'alamat', value: 'Supplier default untuk data migrasi' },
      { name: 'kota', value: '' },
      { name: 'provinsi', value: '' },
      { name: 'is_active', value: 1 },
      { name: 'created_at', value: new Date() },
      { name: 'updated_at', value: new Date() }
    ]);

    const outletMap = await migrateOutlets(pg, mysqlConn);
    await migrateProducts(pg, mysqlConn, kategoriId, supplierId, adminId);
    await migrateSimpleTable(pg, mysqlConn, 'pembelian', ['tanggal', 'sku', 'qty', 'created_at']);
    await migrateSimpleTable(pg, mysqlConn, 'stok_awal', ['sku', 'qty_awal', 'created_at']);
    await migrateSimpleTable(pg, mysqlConn, 'stok_penyesuaian', ['tanggal', 'sku', 'qty', 'keterangan', 'created_at']);
    await migrateSimpleTable(pg, mysqlConn, 'outlet_stok_awal', ['outlet_id', 'sku', 'periode', 'qty_awal', 'created_at']);
    await migrateSimpleTable(pg, mysqlConn, 'outlet_stok_masuk', ['tanggal', 'outlet_id', 'sku', 'qty', 'sumber', 'ref_penjualan_id', 'keterangan', 'checker', 'created_at']);
    await migrateSimpleTable(pg, mysqlConn, 'outlet_penjualan', ['tanggal', 'outlet_id', 'sku', 'qty', 'sumber', 'keterangan', 'imported_at']);
    await migrateSimpleTable(pg, mysqlConn, 'outlet_stok_penyesuaian', ['tanggal', 'outlet_id', 'sku', 'qty', 'alasan', 'checker', 'approved_by', 'created_at']);
  await migrateSimpleTable(pg, mysqlConn, 'outlet_stok_opname', ['id', 'tanggal', 'outlet_id', 'total_item', 'total_selisih', 'checker', 'approved_by', 'keterangan', 'created_at']);

    log('Migration complete.');
    if (!dryRun) {
      log(`Admin user created: ${DEFAULTS.admin.username} / ${DEFAULTS.admin.password}`);
      log('Please change the admin password immediately after logging in.');
    }
  } catch (error) {
    log('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pg.end().catch(() => {});
    await mysqlConn.end().catch(() => {});
  }
}

run();
