# Product Management Blueprint
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_app.models import db, Produk, Kategori, Supplier, User, BarcodeProdk
from flask_app.utils.auth import role_required
from flask_app.utils.barcode import BarcodeService
from flask_app.utils.helpers import ResponseHelper, QueryHelper, validate_json
from datetime import datetime
from sqlalchemy import or_, and_
import logging

produk_bp = Blueprint('produk', __name__)
logger = logging.getLogger(__name__)

@produk_bp.route('/', methods=['GET'])
@jwt_required()
def list_produk():
    """List produk dengan filter dan pagination"""
    try:
        page, per_page = QueryHelper.get_pagination_params(request)
        
        # Filters
        search = request.args.get('search', '')
        kategori_id = request.args.get('kategori_id', type=int)
        supplier_id = request.args.get('supplier_id', type=int)
        is_active = request.args.get('is_active', default=True, type=bool)
        
        # Base query
        query = Produk.query.filter_by(is_active=is_active)
        
        # Apply filters
        if search:
            query = query.filter(or_(
                Produk.kode_barang.ilike(f'%{search}%'),
                Produk.nama_barang.ilike(f'%{search}%'),
                Produk.deskripsi.ilike(f'%{search}%')
            ))
        
        if kategori_id:
            query = query.filter_by(kategori_id=kategori_id)
        
        if supplier_id:
            query = query.filter_by(supplier_id=supplier_id)
        
        # Pagination
        pagination = query.paginate(page=page, per_page=per_page)
        
        data = [{
            'id': p.id,
            'kode_barang': p.kode_barang,
            'nama_barang': p.nama_barang,
            'kategori': p.kategori.nama_kategori if p.kategori else None,
            'supplier': p.supplier.nama_supplier if p.supplier else None,
            'harga_beli': float(p.harga_beli),
            'harga_jual': float(p.harga_jual),
            'min_stok': p.min_stok,
            'max_stok': p.max_stok,
            'satuan': p.satuan,
            'deskripsi': p.deskripsi,
            'is_active': p.is_active,
            'created_at': p.created_at.isoformat(),
            'barcode': p.barcode.barcode_value if p.barcode else None
        } for p in pagination.items]
        
        return ResponseHelper.paginated(data, pagination.total, page, per_page)
    
    except Exception as e:
        logger.error(f'List produk error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@produk_bp.route('/<int:produk_id>', methods=['GET'])
@jwt_required()
def get_produk(produk_id):
    """Get detail produk"""
    try:
        produk = Produk.query.get(produk_id)
        
        if not produk:
            return ResponseHelper.error('Produk not found', status_code=404)
        
        data = {
            'id': produk.id,
            'kode_barang': produk.kode_barang,
            'nama_barang': produk.nama_barang,
            'kategori_id': produk.kategori_id,
            'kategori': produk.kategori.nama_kategori if produk.kategori else None,
            'supplier_id': produk.supplier_id,
            'supplier': produk.supplier.nama_supplier if produk.supplier else None,
            'harga_beli': float(produk.harga_beli),
            'harga_jual': float(produk.harga_jual),
            'min_stok': produk.min_stok,
            'max_stok': produk.max_stok,
            'satuan': produk.satuan,
            'deskripsi': produk.deskripsi,
            'dimensi': {
                'panjang': float(produk.dimensi_panjang) if produk.dimensi_panjang else None,
                'lebar': float(produk.dimensi_lebar) if produk.dimensi_lebar else None,
                'tinggi': float(produk.dimensi_tinggi) if produk.dimensi_tinggi else None,
                'berat_gram': float(produk.berat_gram) if produk.berat_gram else None
            },
            'is_active': produk.is_active,
            'created_at': produk.created_at.isoformat(),
            'barcode': {
                'barcode_value': produk.barcode.barcode_value,
                'format': produk.barcode.format_barcode,
                'barcode_file': produk.barcode.barcode_file_path,
                'qr_code_file': produk.barcode.qr_code_file_path
            } if produk.barcode else None
        }
        
        return ResponseHelper.success(data)
    
    except Exception as e:
        logger.error(f'Get produk error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@produk_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('admin')
@validate_json(['kode_barang', 'nama_barang', 'kategori_id', 'supplier_id', 'harga_beli', 'harga_jual'])
def create_produk():
    """Create produk baru"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate kode_barang uniqueness
        if Produk.query.filter_by(kode_barang=data['kode_barang']).first():
            return ResponseHelper.error('Kode barang already exists', status_code=400)
        
        # Validate kategori dan supplier exist
        if not Kategori.query.get(data['kategori_id']):
            return ResponseHelper.error('Kategori not found', status_code=404)
        
        if not Supplier.query.get(data['supplier_id']):
            return ResponseHelper.error('Supplier not found', status_code=404)
        
        # Create produk
        produk = Produk(
            kode_barang=data['kode_barang'],
            nama_barang=data['nama_barang'],
            kategori_id=data['kategori_id'],
            supplier_id=data['supplier_id'],
            harga_beli=data['harga_beli'],
            harga_jual=data['harga_jual'],
            min_stok=data.get('min_stok', 10),
            max_stok=data.get('max_stok', 100),
            satuan=data.get('satuan', 'pcs'),
            deskripsi=data.get('deskripsi'),
            berat_gram=data.get('berat_gram'),
            dimensi_panjang=data.get('dimensi_panjang'),
            dimensi_lebar=data.get('dimensi_lebar'),
            dimensi_tinggi=data.get('dimensi_tinggi'),
            is_active=data.get('is_active', True),
            created_by=user_id
        )
        
        db.session.add(produk)
        db.session.flush()
        
        # Generate barcode
        barcode_value, barcode_path = BarcodeService.generate_product_barcode(
            produk.kode_barang,
            produk.id
        )
        
        db.session.commit()
        
        logger.info(f'Produk {produk.kode_barang} created by user {user_id}')
        
        return ResponseHelper.success(
            {
                'id': produk.id,
                'kode_barang': produk.kode_barang,
                'nama_barang': produk.nama_barang,
                'barcode_value': barcode_value
            },
            'Produk created successfully',
            201
        )
    
    except Exception as e:
        logger.error(f'Create produk error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@produk_bp.route('/<int:produk_id>', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_produk(produk_id):
    """Update produk"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        produk = Produk.query.get(produk_id)
        if not produk:
            return ResponseHelper.error('Produk not found', status_code=404)
        
        # Update fields
        if 'nama_barang' in data:
            produk.nama_barang = data['nama_barang']
        if 'kategori_id' in data:
            if not Kategori.query.get(data['kategori_id']):
                return ResponseHelper.error('Kategori not found', status_code=404)
            produk.kategori_id = data['kategori_id']
        if 'supplier_id' in data:
            if not Supplier.query.get(data['supplier_id']):
                return ResponseHelper.error('Supplier not found', status_code=404)
            produk.supplier_id = data['supplier_id']
        if 'harga_beli' in data:
            produk.harga_beli = data['harga_beli']
        if 'harga_jual' in data:
            produk.harga_jual = data['harga_jual']
        if 'min_stok' in data:
            produk.min_stok = data['min_stok']
        if 'max_stok' in data:
            produk.max_stok = data['max_stok']
        if 'satuan' in data:
            produk.satuan = data['satuan']
        if 'deskripsi' in data:
            produk.deskripsi = data['deskripsi']
        if 'is_active' in data:
            produk.is_active = data['is_active']
        
        produk.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f'Produk {produk.kode_barang} updated by user {user_id}')
        
        return ResponseHelper.success(
            {
                'id': produk.id,
                'kode_barang': produk.kode_barang,
                'nama_barang': produk.nama_barang,
                'updated_at': produk.updated_at.isoformat()
            },
            'Produk updated successfully'
        )
    
    except Exception as e:
        logger.error(f'Update produk error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@produk_bp.route('/<int:produk_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_produk(produk_id):
    """Soft delete produk"""
    try:
        produk = Produk.query.get(produk_id)
        if not produk:
            return ResponseHelper.error('Produk not found', status_code=404)
        
        # Soft delete
        produk.is_active = False
        produk.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f'Produk {produk.kode_barang} deleted')
        
        return ResponseHelper.success(None, 'Produk deleted successfully')
    
    except Exception as e:
        logger.error(f'Delete produk error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@produk_bp.route('/search', methods=['GET'])
@jwt_required()
def search_produk():
    """Quick search produk"""
    try:
        q = request.args.get('q', '')
        limit = request.args.get('limit', 10, type=int)
        
        if not q:
            return ResponseHelper.error('Search query required', status_code=400)
        
        produk = Produk.query.filter(
            and_(
                Produk.is_active == True,
                or_(
                    Produk.kode_barang.ilike(f'%{q}%'),
                    Produk.nama_barang.ilike(f'%{q}%'),
                    Produk.barcode.barcode_value.ilike(f'%{q}%') if Produk.barcode else False
                )
            )
        ).limit(limit).all()
        
        data = [{
            'id': p.id,
            'kode_barang': p.kode_barang,
            'nama_barang': p.nama_barang,
            'barcode_value': p.barcode.barcode_value if p.barcode else None
        } for p in produk]
        
        return ResponseHelper.success(data)
    
    except Exception as e:
        logger.error(f'Search produk error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)
