# Database Migration Guide - PostgreSQL ke MySQL
## Sistem Manajemen Inventory Warehouse Terintegrasi

---

## 📋 DAFTAR ISI
1. [Overview](#overview)
2. [Persiapan & Backup](#persiapan--backup)
3. [Struktur Database Baru](#struktur-database-baru)
4. [Langkah-Langkah Migration](#langkah-langkah-migration)
5. [Data Mapping Lama ke Baru](#data-mapping-lama-ke-baru)
6. [Verifikasi Data](#verifikasi-data)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Mengapa MySQL?
- Kompatibilitas lebih luas dengan shared hosting
- Setup yang lebih mudah
- Performance yang baik untuk inventory system
- Support untuk transaction yang robust

### Fitur Baru yang Ditambahkan
- **User Authentication** dengan role-based access control (RBAC)
- **Rak Gudang Management** dengan barcode dan kapasitas
- **Advanced Barcode System** dengan CODE128 dan QR Code
- **Enhanced Stok Opname** dengan audit trail lengkap
- **Notification System** untuk alerts
- **Advanced Reporting** dan analytics

---

## Persiapan & Backup

### 1. Backup Data PostgreSQL
```sql
-- Di PostgreSQL, gunakan pg_dump
pg_dump -U username -h localhost -d dbname > backup_postgresql.sql

-- Atau di terminal:
pg_dump -U postgres -d cv_epic_warehouse > backup.sql
```

### 2. Verifikasi Data Penting
```sql
-- Check total records di PostgreSQL
SELECT 'produk' as table_name, COUNT(*) as count FROM produk
UNION ALL
SELECT 'penjualan', COUNT(*) FROM penjualan
UNION ALL
SELECT 'pembelian', COUNT(*) FROM pembelian
UNION ALL
SELECT 'outlet', COUNT(*) FROM outlet
UNION ALL
SELECT 'stok_opname', COUNT(*) FROM stok_opname;
```

### 3. Catat Data Penting
- Jumlah produk yang akan dimigrasikan
- Range tanggal transaksi
- Outlet yang aktif
- Stok opname terakhir

---

## Struktur Database Baru

### Entity Relationship Diagram
```
users (users table untuk auth)
  ├── outlets (1-to-many)
  ├── transaksi_header (1-to-many)
  └── audit_logs (1-to-many)

produk (master barang)
  ├── barcode (1-to-1)
  ├── kategori (many-to-1)
  ├── supplier (many-to-1)
  ├── stok_real_time (1-to-1)
  └── transaksi_detail (1-to-many)

rak (shelf management)
  ├── lokasi_barang (many-to-1)
  └── rak_capacity_logs (1-to-many)

transaksi_header
  ├── transaksi_detail
  └── transaksi_scan_history

stok_opname_session
  └── stok_opname_detail
      ├── selisih_analisis
      └── adjustment_approval

notifikasi (alert system)
```

### Tabel-Tabel Baru

#### A. AUTHENTICATION & ACCESS CONTROL

**users** - User account management
```
id                    INT PRIMARY KEY AUTO_INCREMENT
username              VARCHAR(100) UNIQUE NOT NULL
email                 VARCHAR(150) UNIQUE NOT NULL
password_hash         VARCHAR(255) NOT NULL
nama_lengkap          VARCHAR(200) NOT NULL
role                  ENUM('admin', 'staff_gudang', 'checker_opname') NOT NULL
outlet_id             INT NULL (untuk staff yang assigned ke outlet tertentu)
is_active             BOOLEAN DEFAULT TRUE
last_login            DATETIME NULL
failed_login_count    INT DEFAULT 0
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
FOREIGN KEY (outlet_id) REFERENCES outlets(id)
```

**user_sessions** - Track user sessions
```
id                    INT PRIMARY KEY AUTO_INCREMENT
user_id               INT NOT NULL
session_token         VARCHAR(500) UNIQUE NOT NULL
ip_address            VARCHAR(45)
user_agent            VARCHAR(500)
login_at              DATETIME DEFAULT CURRENT_TIMESTAMP
logout_at             DATETIME NULL
is_active             BOOLEAN DEFAULT TRUE
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
INDEX (session_token, is_active)
```

**role_permissions** - Define role permissions
```
id                    INT PRIMARY KEY AUTO_INCREMENT
role                  VARCHAR(50) NOT NULL
permission            VARCHAR(100) NOT NULL
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE KEY (role, permission)
```

#### B. MASTER DATA

**kategori** - Product categories
```
id                    INT PRIMARY KEY AUTO_INCREMENT
nama_kategori         VARCHAR(150) UNIQUE NOT NULL
deskripsi             TEXT
is_active             BOOLEAN DEFAULT TRUE
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

**supplier** - Supplier management
```
id                    INT PRIMARY KEY AUTO_INCREMENT
nama_supplier         VARCHAR(200) UNIQUE NOT NULL
no_telp               VARCHAR(20)
email                 VARCHAR(150)
alamat                TEXT
kota                  VARCHAR(100)
provinsi              VARCHAR(100)
is_active             BOOLEAN DEFAULT TRUE
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

**produk** - Product master (UPDATED)
```
id                    INT PRIMARY KEY AUTO_INCREMENT
kode_barang           VARCHAR(50) UNIQUE NOT NULL
nama_barang           VARCHAR(255) NOT NULL
kategori_id           INT NOT NULL
supplier_id           INT NOT NULL
deskripsi             TEXT
harga_beli            DECIMAL(14, 2) NOT NULL DEFAULT 0
harga_jual            DECIMAL(14, 2) NOT NULL DEFAULT 0
min_stok              INT NOT NULL DEFAULT 10
max_stok              INT NOT NULL DEFAULT 100
satuan                VARCHAR(20) DEFAULT 'pcs' (pcs, box, karton, dll)
berat_gram            DECIMAL(8, 3) NULL
dimensi_panjang       DECIMAL(8, 2) NULL
dimensi_lebar         DECIMAL(8, 2) NULL
dimensi_tinggi        DECIMAL(8, 2) NULL
is_active             BOOLEAN DEFAULT TRUE
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
created_by            INT NOT NULL
FOREIGN KEY (kategori_id) REFERENCES kategori(id)
FOREIGN KEY (supplier_id) REFERENCES supplier(id)
FOREIGN KEY (created_by) REFERENCES users(id)
INDEX (kode_barang)
INDEX (kategori_id, is_active)
```

**outlets** - Outlet/warehouse locations (UPDATED)
```
id                    INT PRIMARY KEY AUTO_INCREMENT
nama_outlet           VARCHAR(255) UNIQUE NOT NULL
kode_outlet           VARCHAR(50) UNIQUE NOT NULL
alamat                TEXT
kota                  VARCHAR(100)
no_telp               VARCHAR(20)
manager_id            INT NULL
is_active             BOOLEAN DEFAULT TRUE
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
FOREIGN KEY (manager_id) REFERENCES users(id)
```

#### C. WAREHOUSE STRUCTURE

**rak** - Shelf/rack management
```
id                    INT PRIMARY KEY AUTO_INCREMENT
outlet_id             INT NOT NULL
kode_rak              VARCHAR(50) NOT NULL
barcode_rak           VARCHAR(100) UNIQUE NULL (auto-generated)
kapasitas_maksimum    INT NOT NULL DEFAULT 100
tipe_rak              VARCHAR(50) DEFAULT 'standard' (standard, special, heavy-duty)
lokasi                VARCHAR(100) NOT NULL (A-1, A-2, B-1, dll)
is_active             BOOLEAN DEFAULT TRUE
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
UNIQUE KEY (outlet_id, kode_rak)
FOREIGN KEY (outlet_id) REFERENCES outlets(id)
INDEX (kode_rak, is_active)
```

**rak_capacity_logs** - Track rack capacity usage
```
id                    INT PRIMARY KEY AUTO_INCREMENT
rak_id                INT NOT NULL
qty_saat_ini          INT DEFAULT 0
persentase_kapasitas  DECIMAL(5, 2) DEFAULT 0
status_kapasitas      ENUM('normal', 'warning', 'penuh') DEFAULT 'normal'
checked_at            DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (rak_id) REFERENCES rak(id) ON DELETE CASCADE
INDEX (rak_id, checked_at)
```

**lokasi_barang** - Product location in rack
```
id                    INT PRIMARY KEY AUTO_INCREMENT
produk_id             INT NOT NULL
rak_id                INT NOT NULL
qty_di_rak            INT NOT NULL DEFAULT 0
posisi_detail         VARCHAR(100) NULL (untuk detail positioning)
last_updated          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
UNIQUE KEY (produk_id, rak_id)
FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
FOREIGN KEY (rak_id) REFERENCES rak(id) ON DELETE CASCADE
INDEX (rak_id, produk_id)
```

#### D. BARCODE SYSTEM

**barcode_produk** - Product barcode management
```
id                    INT PRIMARY KEY AUTO_INCREMENT
produk_id             INT NOT NULL UNIQUE
barcode_value         VARCHAR(100) UNIQUE NOT NULL
format_barcode        VARCHAR(20) DEFAULT 'CODE128' (CODE128, QR_CODE, EAN13)
barcode_file_path     VARCHAR(255) NULL (/static/barcodes/BRG001.png)
qr_code_file_path     VARCHAR(255) NULL
generated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
last_printed          DATETIME NULL
print_count           INT DEFAULT 0
is_active             BOOLEAN DEFAULT TRUE
FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
INDEX (barcode_value)
```

**barcode_rak** - Rack barcode management
```
id                    INT PRIMARY KEY AUTO_INCREMENT
rak_id                INT NOT NULL UNIQUE
barcode_value         VARCHAR(100) UNIQUE NOT NULL
barcode_file_path     VARCHAR(255) NULL
generated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
is_active             BOOLEAN DEFAULT TRUE
FOREIGN KEY (rak_id) REFERENCES rak(id) ON DELETE CASCADE
```

**barcode_scan_history** - Scan tracking for analytics
```
id                    INT PRIMARY KEY AUTO_INCREMENT
user_id               INT NOT NULL
barcode_value         VARCHAR(100)
tipe_scan             ENUM('produk', 'rak') NOT NULL
scan_result           ENUM('success', 'not_found', 'error') DEFAULT 'success'
scanned_at            DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
INDEX (barcode_value, scanned_at)
INDEX (user_id, scanned_at)
```

#### E. STOK REAL-TIME & INVENTORY

**stok_real_time** - Current stock level (denormalized for speed)
```
id                    INT PRIMARY KEY AUTO_INCREMENT
produk_id             INT NOT NULL UNIQUE
outlet_id             INT NOT NULL
qty_stok              INT NOT NULL DEFAULT 0
stok_sistem           INT NOT NULL DEFAULT 0
stok_fisik            INT NOT NULL DEFAULT 0
status_stok           ENUM('aman', 'minimum', 'habis', 'overstock') DEFAULT 'aman'
last_opname           DATETIME NULL
updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE
UNIQUE KEY (produk_id, outlet_id)
INDEX (outlet_id, status_stok)
```

**stok_mutasi** - Stock movement/transaction (REPLACES old tables)
```
id                    INT PRIMARY KEY AUTO_INCREMENT
outlet_id             INT NOT NULL
produk_id             INT NOT NULL
tipe_mutasi           ENUM('stok_awal', 'barang_masuk', 'barang_keluar', 'adjustment', 'opname') NOT NULL
qty                   INT NOT NULL
qty_sebelum           INT NOT NULL DEFAULT 0
qty_sesudah           INT NOT NULL DEFAULT 0
keterangan            TEXT
tanggal_mutasi        DATE NOT NULL
user_id               INT NOT NULL
rak_id                INT NULL (untuk track lokasi)
reference_id          VARCHAR(100) NULL (untuk link ke purchase order, sales order, dll)
reference_type        VARCHAR(50) NULL (PO, SO, OPNAME, ADJUSTMENT)
is_approved           BOOLEAN DEFAULT FALSE
approved_by           INT NULL
approved_at           DATETIME NULL
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (outlet_id) REFERENCES outlets(id)
FOREIGN KEY (produk_id) REFERENCES produk(id)
FOREIGN KEY (user_id) REFERENCES users(id)
FOREIGN KEY (rak_id) REFERENCES rak(id)
FOREIGN KEY (approved_by) REFERENCES users(id)
INDEX (outlet_id, tanggal_mutasi)
INDEX (produk_id, tanggal_mutasi)
INDEX (tipe_mutasi, created_at)
```

#### F. STOK OPNAME ADVANCED

**stok_opname_session** - Opname session management (UPDATED)
```
id                    INT PRIMARY KEY AUTO_INCREMENT
outlet_id             INT NOT NULL
tanggal_opname        DATE NOT NULL
status                ENUM('draft', 'in_progress', 'completed', 'approved') DEFAULT 'draft'
checker_id            INT NOT NULL (user yang melakukan opname)
approver_id           INT NULL (user yang approve opname)
total_item_checked    INT DEFAULT 0
total_item_selisih    INT DEFAULT 0
total_qty_selisih     INT DEFAULT 0
tipe_opname           VARCHAR(50) DEFAULT 'full' (full, partial)
keterangan            TEXT
started_at            DATETIME DEFAULT CURRENT_TIMESTAMP
completed_at          DATETIME NULL
approved_at           DATETIME NULL
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
FOREIGN KEY (outlet_id) REFERENCES outlets(id)
FOREIGN KEY (checker_id) REFERENCES users(id)
FOREIGN KEY (approver_id) REFERENCES users(id)
INDEX (outlet_id, tanggal_opname)
INDEX (status, created_at)
```

**stok_opname_detail** - Opname detail per item (UPDATED)
```
id                    INT PRIMARY KEY AUTO_INCREMENT
opname_session_id     INT NOT NULL
produk_id             INT NOT NULL
rak_id                INT NULL
stok_sistem           INT NOT NULL
stok_fisik_input      INT NOT NULL
stok_fisik_verified   INT NULL (setelah approval)
selisih               INT GENERATED ALWAYS AS (stok_fisik_input - stok_sistem) STORED
selisih_approved      INT GENERATED ALWAYS AS (CASE WHEN stok_fisik_verified IS NULL THEN selisih ELSE (stok_fisik_verified - stok_sistem) END) STORED
arah_selisih          ENUM('lebih', 'kurang', 'seimbang') DEFAULT 'seimbang'
catatan_selisih       TEXT
checked_at            DATETIME DEFAULT CURRENT_TIMESTAMP
verified_at           DATETIME NULL
FOREIGN KEY (opname_session_id) REFERENCES stok_opname_session(id) ON DELETE CASCADE
FOREIGN KEY (produk_id) REFERENCES produk(id)
FOREIGN KEY (rak_id) REFERENCES rak(id)
INDEX (opname_session_id, produk_id)
```

**stok_opname_adjustment** - Track adjustments dari opname
```
id                    INT PRIMARY KEY AUTO_INCREMENT
detail_opname_id      INT NOT NULL
qty_adjustment        INT NOT NULL
alasan_adjustment     TEXT
approved_by           INT NULL
status_adjustment     ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
approved_at           DATETIME NULL
FOREIGN KEY (detail_opname_id) REFERENCES stok_opname_detail(id) ON DELETE CASCADE
FOREIGN KEY (approved_by) REFERENCES users(id)
```

**selisih_analisis** - Analisis penyebab selisih opname
```
id                    INT PRIMARY KEY AUTO_INCREMENT
opname_detail_id      INT NOT NULL UNIQUE
kategori_selisih      VARCHAR(100) NOT NULL (rusak, hilang, belum input, input double, dll)
deskripsi             TEXT
analisis_root_cause   TEXT
tindak_lanjut         TEXT
status_tl             ENUM('open', 'closed') DEFAULT 'open'
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
closed_at             DATETIME NULL
FOREIGN KEY (opname_detail_id) REFERENCES stok_opname_detail(id) ON DELETE CASCADE
```

#### G. TRANSAKSI & SCAN

**transaksi_scan** - Scan transaction
```
id                    INT PRIMARY KEY AUTO_INCREMENT
outlet_id             INT NOT NULL
tipe_transaksi        ENUM('barang_masuk', 'barang_keluar') NOT NULL
rak_id                INT NULL (untuk scan rak)
produk_id             INT NULL (untuk scan produk)
qty                   INT NOT NULL
scan_data_json        JSON (store raw scan data for audit)
user_id               INT NOT NULL
is_valid              BOOLEAN DEFAULT FALSE (setelah validasi)
validation_message    TEXT
tanggal_transaksi     DATE NOT NULL
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (outlet_id) REFERENCES outlets(id)
FOREIGN KEY (rak_id) REFERENCES rak(id)
FOREIGN KEY (produk_id) REFERENCES produk(id)
FOREIGN KEY (user_id) REFERENCES users(id)
INDEX (outlet_id, tanggal_transaksi)
```

#### H. NOTIFICATION & ALERT SYSTEM

**notifikasi** - Notification alerts
```
id                    INT PRIMARY KEY AUTO_INCREMENT
user_id               INT NOT NULL
tipe_notifikasi       VARCHAR(50) NOT NULL (stok_minimum, rak_penuh, opname_needed, approval_required)
produk_id             INT NULL
rak_id                INT NULL
outlet_id             INT NULL
pesan                 TEXT NOT NULL
severity              ENUM('info', 'warning', 'critical') DEFAULT 'info'
is_read               BOOLEAN DEFAULT FALSE
action_url            VARCHAR(255) NULL
read_at               DATETIME NULL
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (produk_id) REFERENCES produk(id)
FOREIGN KEY (rak_id) REFERENCES rak(id)
FOREIGN KEY (outlet_id) REFERENCES outlets(id)
INDEX (user_id, is_read, created_at)
INDEX (severity, created_at)
```

**notifikasi_config** - Notification rules/thresholds
```
id                    INT PRIMARY KEY AUTO_INCREMENT
outlet_id             INT NOT NULL
tipe_notifikasi       VARCHAR(50) NOT NULL
is_enabled            BOOLEAN DEFAULT TRUE
threshold_value       INT NULL (untuk stok minimum, dll)
notifikasi_to_role    VARCHAR(50) (admin, staff_gudang, checker)
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (outlet_id) REFERENCES outlets(id)
```

#### I. AUDIT & REPORTING

**audit_log** - System audit trail
```
id                    INT PRIMARY KEY AUTO_INCREMENT
user_id               INT NOT NULL
action                VARCHAR(100) NOT NULL (CREATE, UPDATE, DELETE, APPROVE, REJECT)
table_name            VARCHAR(100) NOT NULL
record_id             INT
old_values            JSON NULL
new_values            JSON NULL
ip_address            VARCHAR(45)
user_agent            VARCHAR(500)
timestamp              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
INDEX (user_id, timestamp)
INDEX (table_name, record_id)
```

**laporan_stok** - Stock reports (cached)
```
id                    INT PRIMARY KEY AUTO_INCREMENT
outlet_id             INT NOT NULL
tanggal_laporan       DATE NOT NULL
total_item            INT
total_qty             INT
total_nilai_stok      DECIMAL(14, 2)
item_minimum_stok     INT
item_overstock        INT
item_rusak_est        INT
generated_by          INT NOT NULL
generated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (outlet_id) REFERENCES outlets(id)
FOREIGN KEY (generated_by) REFERENCES users(id)
```

---

## Langkah-Langkah Migration

### Step 1: Setup MySQL Database Baru

```bash
# Connect ke MySQL
mysql -u root -p

# Create database
CREATE DATABASE cv_epic_warehouse_mysql CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cv_epic_warehouse_mysql;
```

### Step 2: Jalankan Schema Creation SQL
Lihat file `database_schema_mysql_complete.sql` yang disediakan terpisah.

### Step 3: Data Migration dari PostgreSQL

#### 3.1 Export data dari PostgreSQL ke CSV
```sql
-- Di PostgreSQL, export master data
COPY produk TO '/tmp/produk.csv' DELIMITER ',' CSV HEADER;
COPY outlet TO '/tmp/outlet.csv' DELIMITER ',' CSV HEADER;
COPY penjualan TO '/tmp/penjualan.csv' DELIMITER ',' CSV HEADER;
COPY pembelian TO '/tmp/pembelian.csv' DELIMITER ',' CSV HEADER;
COPY stok_awal TO '/tmp/stok_awal.csv' DELIMITER ',' CSV HEADER;
COPY stok_opname TO '/tmp/stok_opname.csv' DELIMITER ',' CSV HEADER;
COPY stok_opname_detail TO '/tmp/stok_opname_detail.csv' DELIMITER ',' CSV HEADER;
```

#### 3.2 Import ke MySQL

```sql
-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS=0;

-- Import kategori (create default categories first)
INSERT INTO kategori (nama_kategori, deskripsi) VALUES
('Produk Umum', 'Kategori default'),
('Bahan Baku', 'Material untuk produksi'),
('Barang Jadi', 'Produk final');

-- Import supplier (create default supplier)
INSERT INTO supplier (nama_supplier, kota) VALUES
('Supplier Default', 'Jakarta');

-- Import produk dari CSV
LOAD DATA LOCAL INFILE '/path/to/produk.csv'
INTO TABLE produk
COLUMNS TERMINATED BY ','
IGNORE 1 ROWS
(kode_barang, nama_barang, @kategori_id, @supplier_id, harga_beli, harga_jual)
SET kategori_id = COALESCE(@kategori_id, 1),
    supplier_id = COALESCE(@supplier_id, 1),
    created_by = 1;

-- Import outlets
LOAD DATA LOCAL INFILE '/path/to/outlet.csv'
INTO TABLE outlets
COLUMNS TERMINATED BY ','
IGNORE 1 ROWS
(nama_outlet, kode_outlet);

-- Import transaksi dan convert ke stok_mutasi
INSERT INTO stok_mutasi (outlet_id, produk_id, tipe_mutasi, qty, qty_sebelum, qty_sesudah, keterangan, tanggal_mutasi, user_id, reference_type)
SELECT 
  o.id,
  p.id,
  'barang_masuk' as tipe_mutasi,
  pb.qty,
  0, -- akan dihitung kemudian
  0,
  'Import dari pembelian lama',
  pb.tanggal,
  1, -- admin user
  'LEGACY_PB'
FROM pembelian pb
JOIN outlets o ON o.nama_outlet = 'Default Warehouse'
JOIN produk p ON p.kode_barang = pb.sku;

-- Similar untuk penjualan sebagai barang_keluar
-- Similar untuk stok_awal

-- Re-enable foreign keys
SET FOREIGN_KEY_CHECKS=1;
```

### Step 4: Data Validation & Reconciliation

```sql
-- Verify product count
SELECT COUNT(*) as total_produk FROM produk;

-- Verify outlet count
SELECT COUNT(*) as total_outlet FROM outlets;

-- Calculate current stok for all products
UPDATE stok_real_time rt
SET qty_stok = COALESCE(
  (SELECT SUM(qty) FROM stok_mutasi WHERE produk_id = rt.produk_id AND outlet_id = rt.outlet_id AND tipe_mutasi = 'barang_masuk'),
  0
) - COALESCE(
  (SELECT SUM(qty) FROM stok_mutasi WHERE produk_id = rt.produk_id AND outlet_id = rt.outlet_id AND tipe_mutasi = 'barang_keluar'),
  0
) + COALESCE(
  (SELECT qty_stok FROM stok_mutasi WHERE produk_id = rt.produk_id AND outlet_id = rt.outlet_id AND tipe_mutasi = 'stok_awal' LIMIT 1),
  0
);
```

---

## Data Mapping Lama ke Baru

### Produk Table
| PostgreSQL | MySQL Baru | Tipe Konversi | Catatan |
|-----------|-----------|---------------|---------|
| sku | kode_barang | Direct copy | Unique constraint pada kode_barang |
| nama_produk | nama_barang | Direct copy | - |
| harga_beli | harga_beli | Direct copy | - |
| harga_jual | harga_jual | Direct copy | - |
| - | kategori_id | Generate | Default ke kategori 'Produk Umum' |
| - | supplier_id | Generate | Default ke supplier 'Supplier Default' |
| - | min_stok | Calculate | Dari historical data atau default 10 |
| - | max_stok | Calculate | Dari historical data atau default 100 |

### Transaksi Tables
Konversi dari 3 tabel (penjualan, pembelian, stok_penyesuaian) ke 1 tabel unified:

```
penjualan → stok_mutasi (tipe_mutasi='barang_keluar')
pembelian → stok_mutasi (tipe_mutasi='barang_masuk')
stok_penyesuaian → stok_mutasi (tipe_mutasi='adjustment')
stok_awal → stok_mutasi (tipe_mutasi='stok_awal')
```

### Outlet Table
| PostgreSQL | MySQL Baru | Tipe Konversi |
|-----------|-----------|---------------|
| id | id | Direct (set AUTO_INCREMENT) |
| nama_outlet | nama_outlet | Direct copy |
| - | kode_outlet | Generate (OUTLET-001, OUTLET-002, dll) |
| - | manager_id | NULL (assign manual) |

---

## Verifikasi Data

### Checklist Verifikasi Post-Migration

```sql
-- 1. Check all tables created
SHOW TABLES;

-- 2. Count records comparison
SELECT 'produk' as table_name, COUNT(*) FROM produk
UNION
SELECT 'outlets', COUNT(*) FROM outlets
UNION
SELECT 'users', COUNT(*) FROM users
UNION
SELECT 'stok_mutasi', COUNT(*) FROM stok_mutasi
UNION
SELECT 'stok_opname_session', COUNT(*) FROM stok_opname_session;

-- 3. Check data integrity
SELECT COUNT(*) as missing_kategori FROM produk WHERE kategori_id IS NULL;
SELECT COUNT(*) as missing_supplier FROM produk WHERE supplier_id IS NULL;
SELECT COUNT(*) as invalid_stok FROM stok_real_time WHERE qty_stok < 0;

-- 4. Check foreign key integrity
SELECT p.id, p.kode_barang, p.kategori_id 
FROM produk p 
WHERE p.kategori_id NOT IN (SELECT id FROM kategori);

-- 5. Verify stok calculations
SELECT p.kode_barang, p.nama_barang, rt.qty_stok
FROM produk p
JOIN stok_real_time rt ON rt.produk_id = p.id
WHERE rt.qty_stok < rt.outlet_id -- invalid state
LIMIT 10;

-- 6. Check for duplicate barcodes
SELECT barcode_value, COUNT(*) 
FROM barcode_produk 
GROUP BY barcode_value 
HAVING COUNT(*) > 1;
```

---

## Troubleshooting

### Common Issues

#### 1. "Error 1406: Data too long for column"
**Solusi**: Adjust column lengths di schema atau truncate data
```sql
ALTER TABLE produk MODIFY COLUMN nama_barang VARCHAR(500);
```

#### 2. "Error 1452: Cannot add or update a child row"
**Solusi**: Check foreign keys sebelum import
```sql
-- Debug foreign key errors
EXPLAIN SELECT * FROM produk WHERE kategori_id NOT IN (SELECT id FROM kategori);
```

#### 3. "Error 1216: Cannot add foreign key constraint"
**Solusi**: Buat parent table dulu sebelum child table
```sql
-- Verify parent exists
SELECT COUNT(*) FROM kategori;
SELECT COUNT(*) FROM supplier;
```

#### 4. Character Encoding Issues
**Solusi**: Ensure UTF8MB4 encoding di CREATE TABLE
```sql
ALTER TABLE produk CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 5. CSV Import Delimiter Issues
**Solusi**: Verify CSV file delimiter dan line terminators
```sql
-- Test dengan proper escaping
LOAD DATA LOCAL INFILE 'file.csv'
INTO TABLE produk
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
```

---

## Post-Migration Tasks

### 1. Reset Auto Increments
```sql
-- Ensure IDs continue from last record
SELECT AUTO_INCREMENT 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'produk';

-- Set next auto_increment if needed
ALTER TABLE produk AUTO_INCREMENT = 10001;
```

### 2. Create Default Users
```sql
INSERT INTO users (username, email, password_hash, nama_lengkap, role) VALUES
('admin', 'admin@warehouse.local', SHA2('admin123', 256), 'Administrator', 'admin'),
('staff1', 'staff1@warehouse.local', SHA2('staff123', 256), 'Staf Gudang 1', 'staff_gudang'),
('checker1', 'checker1@warehouse.local', SHA2('checker123', 256), 'Checker Opname 1', 'checker_opname');

INSERT INTO role_permissions (role, permission) VALUES
('admin', 'view_all'),
('admin', 'edit_all'),
('admin', 'delete_all'),
('admin', 'approve_opname'),
('staff_gudang', 'scan_barang'),
('staff_gudang', 'barang_masuk'),
('staff_gudang', 'barang_keluar'),
('checker_opname', 'perform_opname'),
('checker_opname', 'view_stok');
```

### 3. Setup Database User untuk Aplikasi
```sql
-- Create app user (limited permissions)
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON cv_epic_warehouse_mysql.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Enable Backups
```bash
# Setup daily backup script
0 2 * * * mysqldump -u app_user -p cv_epic_warehouse_mysql > /backup/warehouse_$(date +\%Y\%m\%d).sql
```

### 5. Test Koneksi Flask
Update `.env` file:
```
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=secure_password
DB_NAME=cv_epic_warehouse_mysql
DB_PORT=3306
```

Test koneksi:
```python
from flask import Flask
from flask_mysqldb import MySQL

app = Flask(__name__)
mysql = MySQL(app)

with app.app_context():
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT COUNT(*) FROM produk")
    result = cursor.fetchone()
    print(f"Total produk: {result[0]}")
```

---

## Timeline & Recommendations

### Phase 1: Preparation (1-2 jam)
- [ ] Backup PostgreSQL
- [ ] Verify data integrity
- [ ] Setup MySQL server

### Phase 2: Migration (2-3 jam)
- [ ] Create schema di MySQL
- [ ] Import data
- [ ] Run validation queries
- [ ] Fix data issues

### Phase 3: Testing (1-2 jam)
- [ ] Test Flask connection
- [ ] Verify API endpoints
- [ ] Test stok calculations
- [ ] Test opname flow

### Phase 4: Verification (1 jam)
- [ ] Compare data counts PostgreSQL vs MySQL
- [ ] Spot-check records
- [ ] User acceptance testing
- [ ] Production deployment

**Total: 5-8 jam estimated (1 hari kerja)**

---

## Support & Rollback Plan

### Rollback Strategy
1. Keep PostgreSQL backup sampai 1 bulan setelah migration
2. Document semua data transformations
3. Siapkan script untuk reverse-migrate jika diperlukan

### Monitoring Post-Migration
```sql
-- Daily health check script
SELECT DATE(NOW()) as check_date,
       COUNT(*) as total_products,
       SUM(qty_stok) as total_stok,
       MIN(qty_stok) as min_stok,
       MAX(qty_stok) as max_stok
FROM produk p
JOIN stok_real_time rt ON rt.produk_id = p.id;
```

---

**Document Version**: 1.0
**Last Updated**: 2024
**Prepared For**: Flask Python + MySQL Migration

