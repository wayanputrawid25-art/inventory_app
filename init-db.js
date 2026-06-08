import pool from './services/db.js';
import fs from 'fs';
import path from 'path';

const SAFE_SCHEMA = path.resolve('./migration_neon_safe.sql');
const PERINTAH_SCHEMA = path.resolve('./migration_opname_perintah.sql');
const AUTH_SCHEMA = path.resolve('./migration_auth_login.sql');
const DEFAULT_SCHEMA = path.resolve('./schema.sql');

async function initDB() {
  try {
    console.log('Initializing database...');

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL belum di-set. Isi connection string PostgreSQL/Neon sebelum menjalankan npm run init-db.');
    }

    const schemaFile = fs.existsSync(SAFE_SCHEMA) ? SAFE_SCHEMA : DEFAULT_SCHEMA;
    console.log(`Using schema file: ${schemaFile}`);

    // Read schema file
    const schema = fs.readFileSync(schemaFile, 'utf8');

    // Execute schema
    await pool.query(schema);

    console.log('Schema applied successfully.');
    console.log('Applying safe schema updates if needed...');

    await pool.query(`
      ALTER TABLE stok_opname ADD COLUMN IF NOT EXISTS checker VARCHAR(150);
      ALTER TABLE stok_opname ADD COLUMN IF NOT EXISTS lokasi VARCHAR(150);
      ALTER TABLE stok_opname ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE stok_opname ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE stok_opname_detail ADD COLUMN IF NOT EXISTS input_at TIMESTAMP DEFAULT NOW();
      UPDATE stok_opname SET created_at = COALESCE(updated_at, NOW()) WHERE created_at IS NULL;
    `);

    if (fs.existsSync(PERINTAH_SCHEMA)) {
      const perintahSql = fs.readFileSync(PERINTAH_SCHEMA, 'utf8');
      await pool.query(perintahSql);
      console.log('Perintah SO schema applied.');
    }

    if (fs.existsSync(AUTH_SCHEMA)) {
      const authSql = fs.readFileSync(AUTH_SCHEMA, 'utf8');
      await pool.query(authSql);
      console.log('Auth/login schema and default users applied.');
    }

    console.log('Database initialized successfully! No existing data was deleted.');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initDB();