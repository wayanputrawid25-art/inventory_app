# Database Models untuk CV EPIC Warehouse
# Menggunakan SQLAlchemy ORM

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import func, event
from sqlalchemy.dialects.mysql import JSON, ENUM
import enum

db = SQLAlchemy()

# ============================================
# ENUMS
# ============================================

class RoleEnum(enum.Enum):
    ADMIN = "admin"
    STAFF_GUDANG = "staff_gudang"
    CHECKER_OPNAME = "checker_opname"

class TransaksiTypeEnum(enum.Enum):
    STOK_AWAL = "stok_awal"
    BARANG_MASUK = "barang_masuk"
    BARANG_KELUAR = "barang_keluar"
    ADJUSTMENT = "adjustment"
    OPNAME = "opname"

class OpnameStatusEnum(enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    APPROVED = "approved"

class NotifikasiTypeEnum(enum.Enum):
    STOK_MINIMUM = "stok_minimum"
    RAK_PENUH = "rak_penuh"
    OPNAME_NEEDED = "opname_needed"
    APPROVAL_REQUIRED = "approval_required"

# ============================================
# 1. AUTHENTICATION & USERS
# ============================================

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False, index=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    nama_lengkap = db.Column(db.String(200), nullable=False)
    role = db.Column(ENUM(RoleEnum), nullable=False, default=RoleEnum.STAFF_GUDANG)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id', ondelete='SET NULL'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime, nullable=True)
    failed_login_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = db.relationship('UserSession', backref='user', lazy=True, cascade='all, delete-orphan')
    outlet = db.relationship('Outlet', backref='users')
    
    def __repr__(self):
        return f'<User {self.username}>'

class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    session_token = db.Column(db.String(500), unique=True, nullable=False, index=True)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))
    login_at = db.Column(db.DateTime, default=datetime.utcnow)
    logout_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

# ============================================
# 2. MASTER DATA
# ============================================

class Kategori(db.Model):
    __tablename__ = 'kategori'
    
    id = db.Column(db.Integer, primary_key=True)
    nama_kategori = db.Column(db.String(150), unique=True, nullable=False)
    deskripsi = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    produk = db.relationship('Produk', backref='kategori', lazy=True)

class Supplier(db.Model):
    __tablename__ = 'supplier'
    
    id = db.Column(db.Integer, primary_key=True)
    nama_supplier = db.Column(db.String(200), unique=True, nullable=False)
    no_telp = db.Column(db.String(20))
    email = db.Column(db.String(150))
    alamat = db.Column(db.Text)
    kota = db.Column(db.String(100))
    provinsi = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    produk = db.relationship('Produk', backref='supplier', lazy=True)

class Outlet(db.Model):
    __tablename__ = 'outlets'
    
    id = db.Column(db.Integer, primary_key=True)
    nama_outlet = db.Column(db.String(255), unique=True, nullable=False)
    kode_outlet = db.Column(db.String(50), unique=True, nullable=False)
    alamat = db.Column(db.Text)
    kota = db.Column(db.String(100))
    no_telp = db.Column(db.String(20))
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rak = db.relationship('Rak', backref='outlet', lazy=True, cascade='all, delete-orphan')
    stok_mutasi = db.relationship('StokMutasi', backref='outlet', lazy=True)
    opname_session = db.relationship('OpnameSession', backref='outlet', lazy=True)

class Produk(db.Model):
    __tablename__ = 'produk'
    
    id = db.Column(db.Integer, primary_key=True)
    kode_barang = db.Column(db.String(50), unique=True, nullable=False, index=True)
    nama_barang = db.Column(db.String(255), nullable=False)
    kategori_id = db.Column(db.Integer, db.ForeignKey('kategori.id', ondelete='RESTRICT'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.id', ondelete='RESTRICT'), nullable=False)
    deskripsi = db.Column(db.Text)
    harga_beli = db.Column(db.DECIMAL(14, 2), default=0)
    harga_jual = db.Column(db.DECIMAL(14, 2), default=0)
    min_stok = db.Column(db.Integer, default=10)
    max_stok = db.Column(db.Integer, default=100)
    satuan = db.Column(db.String(20), default='pcs')
    berat_gram = db.Column(db.DECIMAL(8, 3))
    dimensi_panjang = db.Column(db.DECIMAL(8, 2))
    dimensi_lebar = db.Column(db.DECIMAL(8, 2))
    dimensi_tinggi = db.Column(db.DECIMAL(8, 2))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    
    # Relationships
    barcode = db.relationship('BarcodeProdk', backref='produk', uselist=False, lazy=True, cascade='all, delete-orphan')
    lokasi = db.relationship('LokasiBarang', backref='produk', lazy=True, cascade='all, delete-orphan')
    stok_real_time = db.relationship('StokRealTime', backref='produk', uselist=False, lazy=True, cascade='all, delete-orphan')
    stok_mutasi = db.relationship('StokMutasi', backref='produk', lazy=True)

# ============================================
# 3. WAREHOUSE STRUCTURE - RAK
# ============================================

class Rak(db.Model):
    __tablename__ = 'rak'
    
    id = db.Column(db.Integer, primary_key=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id', ondelete='CASCADE'), nullable=False)
    kode_rak = db.Column(db.String(50), nullable=False)
    barcode_rak = db.Column(db.String(100), unique=True)
    kapasitas_maksimum = db.Column(db.Integer, default=100)
    tipe_rak = db.Column(db.String(50), default='standard')
    lokasi = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('outlet_id', 'kode_rak', name='unique_rak_outlet'),
    )
    
    # Relationships
    capacity_logs = db.relationship('RakCapacityLog', backref='rak', lazy=True, cascade='all, delete-orphan')
    lokasi_barang = db.relationship('LokasiBarang', backref='rak', lazy=True, cascade='all, delete-orphan')
    barcode_rak_rel = db.relationship('BarcodeRak', backref='rak', uselist=False, lazy=True, cascade='all, delete-orphan')

class RakCapacityLog(db.Model):
    __tablename__ = 'rak_capacity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    rak_id = db.Column(db.Integer, db.ForeignKey('rak.id', ondelete='CASCADE'), nullable=False)
    qty_saat_ini = db.Column(db.Integer, default=0)
    persentase_kapasitas = db.Column(db.DECIMAL(5, 2), default=0)
    status_kapasitas = db.Column(db.String(20), default='normal')
    checked_at = db.Column(db.DateTime, default=datetime.utcnow)

class LokasiBarang(db.Model):
    __tablename__ = 'lokasi_barang'
    
    id = db.Column(db.Integer, primary_key=True)
    produk_id = db.Column(db.Integer, db.ForeignKey('produk.id', ondelete='CASCADE'), nullable=False)
    rak_id = db.Column(db.Integer, db.ForeignKey('rak.id', ondelete='CASCADE'), nullable=False)
    qty_di_rak = db.Column(db.Integer, default=0)
    posisi_detail = db.Column(db.String(100))
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('produk_id', 'rak_id', name='unique_produk_rak'),
    )

# ============================================
# 4. BARCODE SYSTEM
# ============================================

class BarcodeProdk(db.Model):
    __tablename__ = 'barcode_produk'
    
    id = db.Column(db.Integer, primary_key=True)
    produk_id = db.Column(db.Integer, db.ForeignKey('produk.id', ondelete='CASCADE'), nullable=False, unique=True)
    barcode_value = db.Column(db.String(100), unique=True, nullable=False, index=True)
    format_barcode = db.Column(db.String(20), default='CODE128')
    barcode_file_path = db.Column(db.String(255))
    qr_code_file_path = db.Column(db.String(255))
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_printed = db.Column(db.DateTime)
    print_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

class BarcodeRak(db.Model):
    __tablename__ = 'barcode_rak'
    
    id = db.Column(db.Integer, primary_key=True)
    rak_id = db.Column(db.Integer, db.ForeignKey('rak.id', ondelete='CASCADE'), nullable=False, unique=True)
    barcode_value = db.Column(db.String(100), unique=True, nullable=False, index=True)
    barcode_file_path = db.Column(db.String(255))
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

class BarcodesScanHistory(db.Model):
    __tablename__ = 'barcode_scan_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    barcode_value = db.Column(db.String(100), index=True)
    tipe_scan = db.Column(db.String(20), nullable=False)
    scan_result = db.Column(db.String(20), default='success')
    scanned_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

# ============================================
# 5. STOCK MANAGEMENT
# ============================================

class StokRealTime(db.Model):
    __tablename__ = 'stok_real_time'
    
    id = db.Column(db.Integer, primary_key=True)
    produk_id = db.Column(db.Integer, db.ForeignKey('produk.id', ondelete='CASCADE'), nullable=False, unique=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id', ondelete='CASCADE'), nullable=False)
    qty_stok = db.Column(db.Integer, default=0)
    stok_sistem = db.Column(db.Integer, default=0)
    stok_fisik = db.Column(db.Integer, default=0)
    status_stok = db.Column(db.String(20), default='aman')
    last_opname = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('produk_id', 'outlet_id', name='unique_produk_outlet'),
    )

class StokMutasi(db.Model):
    __tablename__ = 'stok_mutasi'
    
    id = db.Column(db.Integer, primary_key=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id', ondelete='RESTRICT'), nullable=False)
    produk_id = db.Column(db.Integer, db.ForeignKey('produk.id', ondelete='RESTRICT'), nullable=False)
    tipe_mutasi = db.Column(ENUM(TransaksiTypeEnum), nullable=False)
    qty = db.Column(db.Integer, nullable=False)
    qty_sebelum = db.Column(db.Integer, default=0)
    qty_sesudah = db.Column(db.Integer, default=0)
    keterangan = db.Column(db.Text)
    tanggal_mutasi = db.Column(db.Date, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    rak_id = db.Column(db.Integer, db.ForeignKey('rak.id', ondelete='SET NULL'))
    reference_id = db.Column(db.String(100))
    reference_type = db.Column(db.String(50))
    is_approved = db.Column(db.Boolean, default=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    approved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='stok_mutasi_created')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='stok_mutasi_approved')

# ============================================
# 6. STOCK OPNAME
# ============================================

class OpnameSession(db.Model):
    __tablename__ = 'stok_opname_session'
    
    id = db.Column(db.Integer, primary_key=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id', ondelete='RESTRICT'), nullable=False)
    tanggal_opname = db.Column(db.Date, nullable=False)
    status = db.Column(ENUM(OpnameStatusEnum), default=OpnameStatusEnum.DRAFT)
    checker_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    total_item_checked = db.Column(db.Integer, default=0)
    total_item_selisih = db.Column(db.Integer, default=0)
    total_qty_selisih = db.Column(db.Integer, default=0)
    tipe_opname = db.Column(db.String(50), default='full')
    keterangan = db.Column(db.Text)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    approved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    detail = db.relationship('OpnameDetail', backref='session', lazy=True, cascade='all, delete-orphan')
    checker = db.relationship('User', foreign_keys=[checker_id], backref='opname_checked')
    approver = db.relationship('User', foreign_keys=[approver_id], backref='opname_approved')

class OpnameDetail(db.Model):
    __tablename__ = 'stok_opname_detail'
    
    id = db.Column(db.Integer, primary_key=True)
    opname_session_id = db.Column(db.Integer, db.ForeignKey('stok_opname_session.id', ondelete='CASCADE'), nullable=False)
    produk_id = db.Column(db.Integer, db.ForeignKey('produk.id', ondelete='RESTRICT'), nullable=False)
    rak_id = db.Column(db.Integer, db.ForeignKey('rak.id', ondelete='SET NULL'))
    stok_sistem = db.Column(db.Integer, nullable=False)
    stok_fisik_input = db.Column(db.Integer, nullable=False)
    stok_fisik_verified = db.Column(db.Integer)
    arah_selisih = db.Column(db.String(20), default='seimbang')
    catatan_selisih = db.Column(db.Text)
    checked_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime)
    
    # Relationships
    produk_rel = db.relationship('Produk', backref='opname_detail')
    rak_rel = db.relationship('Rak', backref='opname_detail')
    adjustment = db.relationship('OpnameAdjustment', backref='detail', uselist=False, lazy=True, cascade='all, delete-orphan')
    analisis = db.relationship('SelisihAnalisis', backref='detail', uselist=False, lazy=True, cascade='all, delete-orphan')

class OpnameAdjustment(db.Model):
    __tablename__ = 'stok_opname_adjustment'
    
    id = db.Column(db.Integer, primary_key=True)
    detail_opname_id = db.Column(db.Integer, db.ForeignKey('stok_opname_detail.id', ondelete='CASCADE'), nullable=False, unique=True)
    qty_adjustment = db.Column(db.Integer, nullable=False)
    alasan_adjustment = db.Column(db.Text)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    status_adjustment = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime)

class SelisihAnalisis(db.Model):
    __tablename__ = 'selisih_analisis'
    
    id = db.Column(db.Integer, primary_key=True)
    opname_detail_id = db.Column(db.Integer, db.ForeignKey('stok_opname_detail.id', ondelete='CASCADE'), nullable=False, unique=True)
    kategori_selisih = db.Column(db.String(100), nullable=False)
    deskripsi = db.Column(db.Text)
    analisis_root_cause = db.Column(db.Text)
    tindak_lanjut = db.Column(db.Text)
    status_tl = db.Column(db.String(20), default='open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime)

# ============================================
# 7. SCANNING
# ============================================

class TransaksiScan(db.Model):
    __tablename__ = 'transaksi_scan'
    
    id = db.Column(db.Integer, primary_key=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id', ondelete='RESTRICT'), nullable=False)
    tipe_transaksi = db.Column(db.String(20), nullable=False)
    rak_id = db.Column(db.Integer, db.ForeignKey('rak.id', ondelete='SET NULL'))
    produk_id = db.Column(db.Integer, db.ForeignKey('produk.id', ondelete='SET NULL'))
    qty = db.Column(db.Integer, nullable=False)
    scan_data_json = db.Column(JSON)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    is_valid = db.Column(db.Boolean, default=False)
    validation_message = db.Column(db.Text)
    tanggal_transaksi = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ============================================
# 8. NOTIFICATIONS
# ============================================

class Notifikasi(db.Model):
    __tablename__ = 'notifikasi'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    tipe_notifikasi = db.Column(db.String(50), nullable=False)
    produk_id = db.Column(db.Integer, db.ForeignKey('produk.id', ondelete='SET NULL'))
    rak_id = db.Column(db.Integer, db.ForeignKey('rak.id', ondelete='SET NULL'))
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id', ondelete='SET NULL'))
    pesan = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), default='info')
    is_read = db.Column(db.Boolean, default=False)
    action_url = db.Column(db.String(255))
    read_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class NotifikasiConfig(db.Model):
    __tablename__ = 'notifikasi_config'
    
    id = db.Column(db.Integer, primary_key=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id', ondelete='CASCADE'), nullable=False)
    tipe_notifikasi = db.Column(db.String(50), nullable=False)
    is_enabled = db.Column(db.Boolean, default=True)
    threshold_value = db.Column(db.Integer)
    notifikasi_to_role = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('outlet_id', 'tipe_notifikasi', name='unique_outlet_tipe_notif'),
    )

# ============================================
# 9. AUDIT & REPORTING
# ============================================

class AuditLog(db.Model):
    __tablename__ = 'audit_log'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    table_name = db.Column(db.String(100), nullable=False)
    record_id = db.Column(db.Integer)
    old_values = db.Column(JSON)
    new_values = db.Column(JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class LaporanStok(db.Model):
    __tablename__ = 'laporan_stok'
    
    id = db.Column(db.Integer, primary_key=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id', ondelete='CASCADE'), nullable=False)
    tanggal_laporan = db.Column(db.Date, nullable=False)
    total_item = db.Column(db.Integer)
    total_qty = db.Column(db.Integer)
    total_nilai_stok = db.Column(db.DECIMAL(14, 2))
    item_minimum_stok = db.Column(db.Integer)
    item_overstock = db.Column(db.Integer)
    item_rusak_est = db.Column(db.Integer)
    generated_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
