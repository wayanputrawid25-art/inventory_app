-- ============================================
-- CV EPIC WAREHOUSE - MySQL Database Schema
-- Complete implementation dengan semua fitur
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. AUTHENTICATION & ACCESS CONTROL
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(200) NOT NULL,
    role ENUM('admin', 'staff_gudang', 'checker_opname') NOT NULL DEFAULT 'staff_gudang',
    outlet_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME NULL,
    failed_login_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_outlet (outlet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_at DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_permission (role, permission),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. MASTER DATA - KATEGORI & SUPPLIER
-- ============================================

CREATE TABLE IF NOT EXISTS kategori (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_kategori VARCHAR(150) UNIQUE NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nama (nama_kategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supplier (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_supplier VARCHAR(200) UNIQUE NOT NULL,
    no_telp VARCHAR(20),
    email VARCHAR(150),
    alamat TEXT,
    kota VARCHAR(100),
    provinsi VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nama (nama_supplier),
    INDEX idx_kota (kota)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. MASTER DATA - OUTLETS
-- ============================================

CREATE TABLE IF NOT EXISTS outlets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_outlet VARCHAR(255) UNIQUE NOT NULL,
    kode_outlet VARCHAR(50) UNIQUE NOT NULL,
    alamat TEXT,
    kota VARCHAR(100),
    no_telp VARCHAR(20),
    manager_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_nama (nama_outlet),
    INDEX idx_kode (kode_outlet),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraint untuk user.outlet_id (tabel sudah dibuat)
ALTER TABLE users ADD CONSTRAINT fk_user_outlet 
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE SET NULL;

-- ============================================
-- 4. MASTER DATA - PRODUK (UPDATED SCHEMA)
-- ============================================

CREATE TABLE IF NOT EXISTS produk (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode_barang VARCHAR(50) UNIQUE NOT NULL,
    nama_barang VARCHAR(255) NOT NULL,
    kategori_id INT NOT NULL,
    supplier_id INT NOT NULL,
    deskripsi TEXT,
    harga_beli DECIMAL(14, 2) NOT NULL DEFAULT 0,
    harga_jual DECIMAL(14, 2) NOT NULL DEFAULT 0,
    min_stok INT NOT NULL DEFAULT 10,
    max_stok INT NOT NULL DEFAULT 100,
    satuan VARCHAR(20) DEFAULT 'pcs',
    berat_gram DECIMAL(8, 3) NULL,
    dimensi_panjang DECIMAL(8, 2) NULL,
    dimensi_lebar DECIMAL(8, 2) NULL,
    dimensi_tinggi DECIMAL(8, 2) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_kode (kode_barang),
    INDEX idx_nama (nama_barang),
    INDEX idx_kategori (kategori_id),
    INDEX idx_supplier (supplier_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. WAREHOUSE STRUCTURE - RAK
-- ============================================

CREATE TABLE IF NOT EXISTS rak (
    id INT PRIMARY KEY AUTO_INCREMENT,
    outlet_id INT NOT NULL,
    kode_rak VARCHAR(50) NOT NULL,
    barcode_rak VARCHAR(100) UNIQUE NULL,
    kapasitas_maksimum INT NOT NULL DEFAULT 100,
    tipe_rak VARCHAR(50) DEFAULT 'standard',
    lokasi VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rak (outlet_id, kode_rak),
    INDEX idx_kode_rak (kode_rak),
    INDEX idx_outlet (outlet_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rak_capacity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rak_id INT NOT NULL,
    qty_saat_ini INT DEFAULT 0,
    persentase_kapasitas DECIMAL(5, 2) DEFAULT 0,
    status_kapasitas ENUM('normal', 'warning', 'penuh') DEFAULT 'normal',
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rak_id) REFERENCES rak(id) ON DELETE CASCADE,
    INDEX idx_rak_checked (rak_id, checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. PRODUCT LOCATION IN WAREHOUSE
-- ============================================

CREATE TABLE IF NOT EXISTS lokasi_barang (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produk_id INT NOT NULL,
    rak_id INT NOT NULL,
    qty_di_rak INT NOT NULL DEFAULT 0,
    posisi_detail VARCHAR(100) NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE,
    FOREIGN KEY (rak_id) REFERENCES rak(id) ON DELETE CASCADE,
    UNIQUE KEY unique_produk_rak (produk_id, rak_id),
    INDEX idx_rak (rak_id),
    INDEX idx_produk (produk_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. BARCODE SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS barcode_produk (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produk_id INT NOT NULL UNIQUE,
    barcode_value VARCHAR(100) UNIQUE NOT NULL,
    format_barcode VARCHAR(20) DEFAULT 'CODE128',
    barcode_file_path VARCHAR(255) NULL,
    qr_code_file_path VARCHAR(255) NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_printed DATETIME NULL,
    print_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE,
    INDEX idx_barcode_value (barcode_value),
    INDEX idx_produk (produk_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS barcode_rak (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rak_id INT NOT NULL UNIQUE,
    barcode_value VARCHAR(100) UNIQUE NOT NULL,
    barcode_file_path VARCHAR(255) NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (rak_id) REFERENCES rak(id) ON DELETE CASCADE,
    INDEX idx_barcode_value (barcode_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS barcode_scan_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    barcode_value VARCHAR(100),
    tipe_scan ENUM('produk', 'rak') NOT NULL,
    scan_result ENUM('success', 'not_found', 'error') DEFAULT 'success',
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_barcode (barcode_value),
    INDEX idx_user_time (user_id, scanned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. STOCK REAL-TIME (DENORMALIZED)
-- ============================================

CREATE TABLE IF NOT EXISTS stok_real_time (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produk_id INT NOT NULL,
    outlet_id INT NOT NULL,
    qty_stok INT NOT NULL DEFAULT 0,
    stok_sistem INT NOT NULL DEFAULT 0,
    stok_fisik INT NOT NULL DEFAULT 0,
    status_stok ENUM('aman', 'minimum', 'habis', 'overstock') DEFAULT 'aman',
    last_opname DATETIME NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE,
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_produk_outlet (produk_id, outlet_id),
    INDEX idx_outlet (outlet_id),
    INDEX idx_status (status_stok),
    INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. STOCK MUTATION / TRANSAKSI UNIFIED
-- ============================================

CREATE TABLE IF NOT EXISTS stok_mutasi (
    id INT PRIMARY KEY AUTO_INCREMENT,
    outlet_id INT NOT NULL,
    produk_id INT NOT NULL,
    tipe_mutasi ENUM('stok_awal', 'barang_masuk', 'barang_keluar', 'adjustment', 'opname') NOT NULL,
    qty INT NOT NULL,
    qty_sebelum INT NOT NULL DEFAULT 0,
    qty_sesudah INT NOT NULL DEFAULT 0,
    keterangan TEXT,
    tanggal_mutasi DATE NOT NULL,
    user_id INT NOT NULL,
    rak_id INT NULL,
    reference_id VARCHAR(100) NULL,
    reference_type VARCHAR(50) NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by INT NULL,
    approved_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE RESTRICT,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (rak_id) REFERENCES rak(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_outlet_date (outlet_id, tanggal_mutasi),
    INDEX idx_produk_date (produk_id, tanggal_mutasi),
    INDEX idx_tipe (tipe_mutasi, created_at),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. STOCK OPNAME ADVANCED
-- ============================================

CREATE TABLE IF NOT EXISTS stok_opname_session (
    id INT PRIMARY KEY AUTO_INCREMENT,
    outlet_id INT NOT NULL,
    tanggal_opname DATE NOT NULL,
    status ENUM('draft', 'in_progress', 'completed', 'approved') DEFAULT 'draft',
    checker_id INT NOT NULL,
    approver_id INT NULL,
    total_item_checked INT DEFAULT 0,
    total_item_selisih INT DEFAULT 0,
    total_qty_selisih INT DEFAULT 0,
    tipe_opname VARCHAR(50) DEFAULT 'full',
    keterangan TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    approved_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE RESTRICT,
    FOREIGN KEY (checker_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_outlet_date (outlet_id, tanggal_opname),
    INDEX idx_status (status, created_at),
    INDEX idx_checker (checker_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stok_opname_detail (
    id INT PRIMARY KEY AUTO_INCREMENT,
    opname_session_id INT NOT NULL,
    produk_id INT NOT NULL,
    rak_id INT NULL,
    stok_sistem INT NOT NULL,
    stok_fisik_input INT NOT NULL,
    stok_fisik_verified INT NULL,
    selisih INT GENERATED ALWAYS AS (stok_fisik_input - stok_sistem) STORED,
    selisih_approved INT GENERATED ALWAYS AS (CASE WHEN stok_fisik_verified IS NULL THEN (stok_fisik_input - stok_sistem) ELSE (stok_fisik_verified - stok_sistem) END) STORED,
    arah_selisih ENUM('lebih', 'kurang', 'seimbang') DEFAULT 'seimbang',
    catatan_selisih TEXT,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME NULL,
    FOREIGN KEY (opname_session_id) REFERENCES stok_opname_session(id) ON DELETE CASCADE,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE RESTRICT,
    FOREIGN KEY (rak_id) REFERENCES rak(id) ON DELETE SET NULL,
    INDEX idx_opname (opname_session_id),
    INDEX idx_produk (produk_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stok_opname_adjustment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    detail_opname_id INT NOT NULL UNIQUE,
    qty_adjustment INT NOT NULL,
    alasan_adjustment TEXT,
    approved_by INT NULL,
    status_adjustment ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME NULL,
    FOREIGN KEY (detail_opname_id) REFERENCES stok_opname_detail(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status_adjustment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS selisih_analisis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    opname_detail_id INT NOT NULL UNIQUE,
    kategori_selisih VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    analisis_root_cause TEXT,
    tindak_lanjut TEXT,
    status_tl ENUM('open', 'closed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    FOREIGN KEY (opname_detail_id) REFERENCES stok_opname_detail(id) ON DELETE CASCADE,
    INDEX idx_kategori (kategori_selisih)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. SCANNING & TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS transaksi_scan (
    id INT PRIMARY KEY AUTO_INCREMENT,
    outlet_id INT NOT NULL,
    tipe_transaksi ENUM('barang_masuk', 'barang_keluar') NOT NULL,
    rak_id INT NULL,
    produk_id INT NULL,
    qty INT NOT NULL,
    scan_data_json JSON,
    user_id INT NOT NULL,
    is_valid BOOLEAN DEFAULT FALSE,
    validation_message TEXT,
    tanggal_transaksi DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE RESTRICT,
    FOREIGN KEY (rak_id) REFERENCES rak(id) ON DELETE SET NULL,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_outlet_date (outlet_id, tanggal_transaksi),
    INDEX idx_tipe (tipe_transaksi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. NOTIFICATION SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS notifikasi (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    tipe_notifikasi VARCHAR(50) NOT NULL,
    produk_id INT NULL,
    rak_id INT NULL,
    outlet_id INT NULL,
    pesan TEXT NOT NULL,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255) NULL,
    read_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE SET NULL,
    FOREIGN KEY (rak_id) REFERENCES rak(id) ON DELETE SET NULL,
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE SET NULL,
    INDEX idx_user_read (user_id, is_read, created_at),
    INDEX idx_severity (severity, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifikasi_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    outlet_id INT NOT NULL,
    tipe_notifikasi VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    threshold_value INT NULL,
    notifikasi_to_role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_outlet_tipe (outlet_id, tipe_notifikasi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. AUDIT & REPORTING
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_time (user_id, timestamp),
    INDEX idx_table_record (table_name, record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS laporan_stok (
    id INT PRIMARY KEY AUTO_INCREMENT,
    outlet_id INT NOT NULL,
    tanggal_laporan DATE NOT NULL,
    total_item INT,
    total_qty INT,
    total_nilai_stok DECIMAL(14, 2),
    item_minimum_stok INT,
    item_overstock INT,
    item_rusak_est INT,
    generated_by INT NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_outlet_date (outlet_id, tanggal_laporan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DEFAULT DATA INSERTION
-- ============================================

INSERT IGNORE INTO kategori (id, nama_kategori, deskripsi) VALUES
(1, 'Produk Umum', 'Kategori default untuk produk umum'),
(2, 'Bahan Baku', 'Material untuk produksi'),
(3, 'Barang Jadi', 'Produk final yang siap jual'),
(4, 'Spare Part', 'Suku cadang dan aksesoris');

INSERT IGNORE INTO supplier (id, nama_supplier, kota) VALUES
(1, 'Supplier Default', 'Jakarta'),
(2, 'Supplier Lokal', 'Jakarta'),
(3, 'Supplier Import', 'Jakarta Utara');

INSERT IGNORE INTO role_permissions (role, permission) VALUES
('admin', 'view_all'),
('admin', 'edit_all'),
('admin', 'delete_all'),
('admin', 'approve_opname'),
('admin', 'manage_users'),
('staff_gudang', 'scan_barang'),
('staff_gudang', 'barang_masuk'),
('staff_gudang', 'barang_keluar'),
('staff_gudang', 'view_stok'),
('checker_opname', 'perform_opname'),
('checker_opname', 'view_stok'),
('checker_opname', 'verify_opname');

INSERT IGNORE INTO outlets (id, nama_outlet, kode_outlet, kota) VALUES
(1, 'Warehouse Pusat', 'WHC-001', 'Jakarta'),
(2, 'Outlet Bandung', 'OTL-002', 'Bandung');

-- ============================================
-- DEFAULT ADMIN USER (PASSWORD: admin123)
-- NOTE: Generate password hash dengan SHA2
-- ============================================

INSERT IGNORE INTO users (id, username, email, password_hash, nama_lengkap, role, outlet_id, is_active) VALUES
(1, 'admin', 'admin@warehouse.local', SHA2('admin123', 256), 'Administrator', 'admin', NULL, TRUE),
(2, 'staff_gudang', 'staff@warehouse.local', SHA2('staff123', 256), 'Staf Gudang 1', 'staff_gudang', 1, TRUE),
(3, 'checker', 'checker@warehouse.local', SHA2('checker123', 256), 'Checker Opname 1', 'checker_opname', 1, TRUE);

-- ============================================
-- VIEWS FOR EASY QUERYING
-- ============================================

CREATE OR REPLACE VIEW v_stok_per_produk AS
SELECT 
    p.id,
    p.kode_barang,
    p.nama_barang,
    k.nama_kategori,
    s.nama_supplier,
    rt.outlet_id,
    o.nama_outlet,
    rt.qty_stok,
    rt.status_stok,
    p.min_stok,
    p.max_stok,
    (rt.qty_stok <= p.min_stok) as is_minimum,
    (rt.qty_stok = 0) as is_habis,
    p.harga_beli,
    p.harga_jual,
    (rt.qty_stok * p.harga_beli) as nilai_stok_beli,
    (rt.qty_stok * p.harga_jual) as nilai_stok_jual
FROM produk p
JOIN kategori k ON p.kategori_id = k.id
JOIN supplier s ON p.supplier_id = s.id
JOIN stok_real_time rt ON p.id = rt.produk_id
JOIN outlets o ON rt.outlet_id = o.id
WHERE p.is_active = TRUE AND o.is_active = TRUE;

CREATE OR REPLACE VIEW v_aktivitas_transaksi_harian AS
SELECT 
    DATE(sm.tanggal_mutasi) as tanggal,
    sm.outlet_id,
    o.nama_outlet,
    sm.tipe_mutasi,
    COUNT(*) as jumlah_transaksi,
    SUM(ABS(sm.qty)) as total_qty
FROM stok_mutasi sm
JOIN outlets o ON sm.outlet_id = o.id
GROUP BY DATE(sm.tanggal_mutasi), sm.outlet_id, sm.tipe_mutasi
ORDER BY tanggal DESC;

CREATE OR REPLACE VIEW v_opname_ringkasan AS
SELECT 
    sos.id,
    sos.outlet_id,
    o.nama_outlet,
    sos.tanggal_opname,
    sos.status,
    COUNT(sod.id) as total_item_opname,
    SUM(CASE WHEN sod.selisih != 0 THEN 1 ELSE 0 END) as item_dengan_selisih,
    SUM(ABS(sod.selisih)) as total_qty_selisih,
    u1.nama_lengkap as checker_name,
    u2.nama_lengkap as approver_name
FROM stok_opname_session sos
JOIN outlets o ON sos.outlet_id = o.id
LEFT JOIN stok_opname_detail sod ON sos.id = sod.opname_session_id
LEFT JOIN users u1 ON sos.checker_id = u1.id
LEFT JOIN users u2 ON sos.approver_id = u2.id
GROUP BY sos.id, sos.outlet_id, o.nama_outlet, sos.tanggal_opname, sos.status, u1.nama_lengkap, u2.nama_lengkap;

-- ============================================
-- END OF SCHEMA CREATION
-- ============================================

SET FOREIGN_KEY_CHECKS = 1;

-- Verify creation
SELECT 'Schema creation successful' as status;
SHOW TABLES;
