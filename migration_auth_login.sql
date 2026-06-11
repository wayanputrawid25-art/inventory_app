-- Authentication schema and default login users for PostgreSQL/Neon.
-- Safe to run repeatedly; it does not drop existing data.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nama_lengkap VARCHAR(200) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff_gudang',
  outlet_id INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMP,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS nama_lengkap VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'staff_gudang';
ALTER TABLE users ADD COLUMN IF NOT EXISTS outlet_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
UPDATE users SET failed_login_count = 0 WHERE failed_login_count IS NULL;
UPDATE users SET role = 'staff_gudang' WHERE role IS NULL OR role = '';
UPDATE users SET email = username || '@warehouse.local' WHERE email IS NULL OR email = '';
UPDATE users SET nama_lengkap = username WHERE nama_lengkap IS NULL OR nama_lengkap = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('admin', 'staff_gudang', 'checker_opname'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);

-- Default accounts for first login.
-- Admin portal: username admin / password admin123
-- User portal:  username checker / password checker123
INSERT INTO users (username, email, password_hash, nama_lengkap, role, outlet_id, is_active, failed_login_count)
VALUES
  ('admin', 'admin@warehouse.local', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Administrator', 'admin', NULL, TRUE, 0),
  ('checker', 'checker@warehouse.local', '2479ca1c0e21926dc45d9f165cc1b341047162a8137771c3288cbbc77865e6f8', 'Checker Opname', 'checker_opname', NULL, TRUE, 0)
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  nama_lengkap = EXCLUDED.nama_lengkap,
  role = EXCLUDED.role,
  is_active = TRUE,
  failed_login_count = 0,
  updated_at = NOW();
