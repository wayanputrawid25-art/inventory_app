# 📦 CV EPIC Warehouse - Sistem Inventory Terintegrasi

Sistem manajemen inventory warehouse modern dengan fitur barcode scanning, stock opname, dan multi-user access control.

---

## 🎯 Fitur Utama

### 1. **Dashboard Khusus Stok Opname**
- Total stok barang realtime
- Total item di warehouse
- Status rak (penuh/normal/warning)
- Barang di bawah minimum stok
- Barang paling cepat keluar
- Histori transaksi terbaru
- Grafik aktivitas stok 7 hari
- Notifikasi alerts

### 2. **Sistem Rak Gudang**
- Management rak dengan kode unik
- Barcode rak otomatis (CODE128)
- Tracking kapasitas rak realtime
- Warning jika rak penuh
- Lokasi barang per rak

### 3. **Sistem Barcode**
- Generator barcode otomatis (CODE128 + QR Code)
- Scan barcode dengan kamera HP
- Preview & download barcode
- Print barcode massal
- Label size support

### 4. **Stock Opname**
- Scan barcode rak → stok sistem otomatis
- Input stok fisik
- Calculate selisih otomatis
- Analisis penyebab selisih
- Approval workflow
- Adjustment stok otomatis
- History & audit trail lengkap

### 5. **Multi-User dengan Role**
- Admin (full access)
- Staff Gudang (transaksi, scan)
- Checker Opname (opname only)
- Outlet assignment per user
- Permission-based access control

### 6. **Dashboard & Reporting**
- KPI cards realtime
- Grafik aktivitas stok
- Export Excel/PDF
- Laporan transaksi
- Laporan opname detail

### 7. **Dark Mode & Responsive**
- Modern dark mode premium
- Mobile-first responsive design
- Smooth animations
- TailwindCSS framework

---

## 🏗️ Struktur Teknologi

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, TailwindCSS, JavaScript (Vanilla) |
| **Backend** | Flask Python, SQLAlchemy ORM |
| **Database** | MySQL 5.7+ dengan structured schema |
| **Authentication** | JWT + Session Management |
| **API** | RESTful dengan versioning (v1) |
| **Barcode** | python-barcode (CODE128), qrcode |
| **Export** | openpyxl (Excel), reportlab (PDF) |

---

## 🚀 Quick Start

### 1. Setup Database

```bash
# Login MySQL
mysql -u root -p

# Create database
CREATE DATABASE cv_epic_warehouse_mysql CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit dan run schema
mysql -u root -p cv_epic_warehouse_mysql < database_schema_mysql_complete.sql
```

### 2. Setup Python Backend

```bash
# Create virtual environment
python -m venv venv

# Activate
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env dengan database credentials Anda
```

### 2.5. Run database migration from PostgreSQL to MySQL

Set `DATABASE_URL` in your `.env` to the PostgreSQL source database, then run:
```bash
npm install
npm run migrate-db
```

> The migration script applies the MySQL schema from `database_schema_mysql_complete.sql` and copies legacy Postgres tables into MySQL.

### 2.6. Sync Neon schema safely without deleting data

The project now includes a safe Neon schema sync workflow.
- `init-db.js` loads `migration_neon_safe.sql` and applies `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE IF NOT EXISTS` statements.
- This updates schema structure without dropping existing Neon data.

To use this from GitHub Actions, add the secret `DATABASE_URL` for Neon, then trigger the workflow in `.github/workflows/neon-schema-sync.yml`.

> GitHub push saja tidak mengubah Neon; workflow harus dijalankan atau di-trigger agar schema sinkron.

### 3. Run Flask Server

```bash
# Activate venv
source venv/bin/activate

# Run development server
python app.py

# Server running at http://localhost:5000
```

### 4. Test Login

```
URL: http://localhost:5000
Username: admin
Password: admin123
```

---

## 📚 Dokumentasi Lengkap

- **[DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md)** - Setup database dari PostgreSQL ke MySQL
- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Panduan lengkap setup & deployment
- **[database_schema_mysql_complete.sql](database_schema_mysql_complete.sql)** - SQL schema lengkap

---

## 📂 Project Structure

```
inventory_app/
├── app.py                                # Main Flask app
├── config.py                             # Configuration
├── requirements.txt                      # Python dependencies
├── .env.example                          # Environment template
│
├── flask_app/                            # Flask application
│   ├── models/                           # SQLAlchemy models
│   ├── blueprints/                       # API endpoints
│   │   ├── auth.py, produk.py, rak.py, stok.py
│   │   ├── opname.py, barcode.py, scan.py
│   │   ├── dashboard.py, report.py
│   ├── utils/                            # Utilities
│   │   ├── auth.py, barcode.py, helpers.py
│   └── services/                         # Business logic
│
├── static/
│   ├── barcodes/                         # Generated barcodes
│   ├── uploads/                          # File uploads
│   ├── reports/                          # Generated reports
│   └── css/, js/                         # Frontend assets
│
├── index.html                            # Main page
└── database_schema_mysql_complete.sql   # Full SQL schema
```

---

## 🔐 Authentication

### Roles & Permissions

| Role | Login | Scan | Mutasi | Opname | Approve | Admin |
|------|-------|------|--------|--------|---------|-------|
| **Admin** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Staff Gudang** | ✓ | ✓ | ✓ | - | - | - |
| **Checker Opname** | ✓ | ✓ | - | ✓ | - | - |

---

## 📊 Teknologi

- Frontend: HTML, CSS, JavaScript, Chart.js
- Backend: Node.js, Express
- Database: PostgreSQL