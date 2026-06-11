-- ============================================
-- CV EPIC Warehouse V3 - Database Migration
-- User Management Tables
-- ============================================

-- Migration: Create users management tables
-- Version: V3
-- Date: 2026-06-10

-- ============================================
-- 1. Create users table (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL COMMENT 'Nama lengkap pengguna',
    username VARCHAR(100) UNIQUE NOT NULL COMMENT 'Username untuk login',
    email VARCHAR(150) UNIQUE NOT NULL COMMENT 'Email pengguna',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Password yang sudah di-hash',
    role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff' COMMENT 'Role pengguna sistem',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT 'Status akun pengguna',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
    
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. Create user_sessions table (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_token (session_token),
    INDEX idx_sessions_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. Create user_activity_log table
-- ============================================

CREATE TABLE IF NOT EXISTS user_activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL COMMENT 'login, logout, create, update, delete, etc.',
    activity_description TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_activity_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. Create password_reset_tokens table
-- ============================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reset_token (token),
    INDEX idx_reset_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. Insert default admin user
-- ============================================

-- Check if admin user exists before inserting
INSERT INTO users (name, username, email, password_hash, role, status, created_at, updated_at)
SELECT 'Administrator', 'admin', 'admin@epicwarehouse.id', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYXq5LhJ5K3e', 'admin', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Note: The password_hash above is for 'admin123' - please change after first login

-- ============================================
-- 6. Insert default manager user
-- ============================================

INSERT INTO users (name, username, email, password_hash, role, status, created_at, updated_at)
SELECT 'Manager Gudang', 'manager', 'manager@epicwarehouse.id', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYXq5LhJ5K3e', 'manager', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'manager');

-- ============================================
-- 7. Insert default staff user
-- ============================================

INSERT INTO users (name, username, email, password_hash, role, status, created_at, updated_at)
SELECT 'Staff Gudang', 'staff', 'staff@epicwarehouse.id', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYXq5LhJ5K3e', 'staff', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'staff');

-- ============================================
-- PostgreSQL Version (for Neon/Postgres)
-- ============================================

-- For PostgreSQL, use this version:

-- CREATE TABLE IF NOT EXISTS users (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(200) NOT NULL,
--     username VARCHAR(100) UNIQUE NOT NULL,
--     email VARCHAR(150) UNIQUE NOT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     role VARCHAR(20) NOT NULL DEFAULT 'staff',
--     status VARCHAR(20) NOT NULL DEFAULT 'active',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     deleted_at TIMESTAMP NULL
-- );

-- CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
-- CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);