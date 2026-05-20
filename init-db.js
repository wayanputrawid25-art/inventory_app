import pool from './services/db.js';
import fs from 'fs';
import path from 'path';

const SAFE_SCHEMA = path.resolve('./migration_neon_safe.sql');
const DEFAULT_SCHEMA = path.resolve('./schema.sql');

async function initDB() {
  try {
    console.log('Initializing database...');

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
      ALTER TABLE stok_opname_detail ADD COLUMN IF NOT EXISTS input_at TIMESTAMP DEFAULT NOW();
    `);

    console.log('Database initialized successfully! No existing data was deleted.');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await pool.end();
  }
}

initDB();