import pool from './services/db.js';
import fs from 'fs';

async function initDB() {
  try {
    console.log('Initializing database...');

    // Read schema file
    const schema = fs.readFileSync('./schema.sql', 'utf8');

    // Execute schema
    await pool.query(schema);

    // Ensure new columns exist in existing database
    await pool.query(`
      ALTER TABLE stok_opname ADD COLUMN IF NOT EXISTS checker VARCHAR(150);
      ALTER TABLE stok_opname ADD COLUMN IF NOT EXISTS lokasi VARCHAR(150);
      ALTER TABLE stok_opname_detail ADD COLUMN IF NOT EXISTS input_at TIMESTAMP DEFAULT NOW();
    `);

    console.log('Database initialized successfully!');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    pool.end();
  }
}

initDB();