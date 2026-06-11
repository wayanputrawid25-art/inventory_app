# Rack Management Blueprint
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_app.models import db, Rak, Outlet, LokasiBarang, BarcodeRak, Produk
from flask_app.utils.auth import role_required, outlet_access_required
from flask_app.utils.barcode import BarcodeService
from flask_app.utils.helpers import ResponseHelper, QueryHelper
from datetime import datetime
from sqlalchemy import or_
import logging

rak_bp = Blueprint('rak', __name__)
logger = logging.getLogger(__name__)

@rak_bp.route('/', methods=['GET'])
@jwt_required()
def list_rak():
    """List rak dengan pagination"""
    try:
        outlet_id = request.args.get('outlet_id', type=int)
        page, per_page = QueryHelper.get_pagination_params(request)
        
        if not outlet_id:
            return ResponseHelper.error('outlet_id parameter required', status_code=400)
        
        # Check outlet exists
        if not Outlet.query.get(outlet_id):
            return ResponseHelper.error('Outlet not found', status_code=404)
        
        query = Rak.query.filter_by(outlet_id=outlet_id)
        
        # Filter
        search = request.args.get('search', '')
        is_active = request.args.get('is_active', default=True, type=bool)
        
        if search:
            query = query.filter(or_(
                Rak.kode_rak.ilike(f'%{search}%'),
                Rak.lokasi.ilike(f'%{search}%')
            ))
        
        query = query.filter_by(is_active=is_active)
        
        pagination = query.paginate(page=page, per_page=per_page)
        
        data = [{
            'id': r.id,
            'kode_rak': r.kode_rak,
            'barcode_rak': r.barcode_rak,
            'lokasi': r.lokasi,
            'tipe_rak': r.tipe_rak,
            'kapasitas_maksimum': r.kapasitas_maksimum,
            'is_active': r.is_active,
            'barcode_file': r.barcode_rak_rel.barcode_file_path if r.barcode_rak_rel else None,
            'created_at': r.created_at.isoformat()
        } for r in pagination.items]
        
        return ResponseHelper.paginated(data, pagination.total, page, per_page)
    
    except Exception as e:
        logger.error(f'List rak error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@rak_bp.route('/<int:rak_id>', methods=['GET'])
@jwt_required()
def get_rak(rak_id):
    """Get detail rak"""
    try:
        rak = Rak.query.get(rak_id)
        
        if not rak:
            return ResponseHelper.error('Rak not found', status_code=404)
        
        # Get lokasi barang di rak ini
        lokasi_list = LokasiBarang.query.filter_by(rak_id=rak_id).all()
        
        data = {
            'id': rak.id,
            'outlet_id': rak.outlet_id,
            'outlet': rak.outlet.nama_outlet,
            'kode_rak': rak.kode_rak,
            'barcode_rak': rak.barcode_rak,
            'lokasi': rak.lokasi,
            'tipe_rak': rak.tipe_rak,
            'kapasitas_maksimum': rak.kapasitas_maksimum,
            'total_qty_saat_ini': sum(l.qty_di_rak for l in lokasi_list),
            'persentase_kapasitas': round((sum(l.qty_di_rak for l in lokasi_list) / rak.kapasitas_maksimum * 100), 2),
            'is_active': rak.is_active,
            'barcode_file': rak.barcode_rak_rel.barcode_file_path if rak.barcode_rak_rel else None,
            'lokasi_barang': [{
                'produk_id': l.produk_id,
                'kode_barang': l.produk.kode_barang,
                'nama_barang': l.produk.nama_barang,
                'qty_di_rak': l.qty_di_rak,
                'posisi_detail': l.posisi_detail,
                'last_updated': l.last_updated.isoformat()
            } for l in lokasi_list],
            'created_at': rak.created_at.isoformat()
        }
        
        return ResponseHelper.success(data)
    
    except Exception as e:
        logger.error(f'Get rak error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@rak_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('admin', 'staff_gudang')
def create_rak():
    """Create rak baru"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['outlet_id', 'kode_rak', 'lokasi', 'kapasitas_maksimum']
        if not all(field in data for field in required_fields):
            return ResponseHelper.error('Missing required fields', status_code=400)
        
        # Check outlet exists
        if not Outlet.query.get(data['outlet_id']):
            return ResponseHelper.error('Outlet not found', status_code=404)
        
        # Check kode_rak uniqueness per outlet
        if Rak.query.filter_by(outlet_id=data['outlet_id'], kode_rak=data['kode_rak']).first():
            return ResponseHelper.error('Kode rak already exists in this outlet', status_code=400)
        
        # Create rak
        rak = Rak(
            outlet_id=data['outlet_id'],
            kode_rak=data['kode_rak'],
            lokasi=data['lokasi'],
            tipe_rak=data.get('tipe_rak', 'standard'),
            kapasitas_maksimum=data['kapasitas_maksimum'],
            is_active=data.get('is_active', True)
        )
        
        db.session.add(rak)
        db.session.flush()
        
        # Generate barcode untuk rak
        barcode_value, barcode_path = BarcodeService.generate_rack_barcode(rak.kode_rak, rak.id)
        
        db.session.commit()
        
        logger.info(f'Rak {rak.kode_rak} created in outlet {data["outlet_id"]}')
        
        return ResponseHelper.success(
            {
                'id': rak.id,
                'kode_rak': rak.kode_rak,
                'barcode_value': barcode_value,
                'barcode_file': barcode_path
            },
            'Rak created successfully',
            201
        )
    
    except Exception as e:
        logger.error(f'Create rak error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@rak_bp.route('/<int:rak_id>', methods=['PUT'])
@jwt_required()
@role_required('admin', 'staff_gudang')
def update_rak(rak_id):
    """Update rak"""
    try:
        rak = Rak.query.get(rak_id)
        if not rak:
            return ResponseHelper.error('Rak not found', status_code=404)
        
        data = request.get_json()
        
        if 'kode_rak' in data:
            # Check uniqueness
            existing = Rak.query.filter(
                Rak.outlet_id == rak.outlet_id,
                Rak.kode_rak == data['kode_rak'],
                Rak.id != rak_id
            ).first()
            if existing:
                return ResponseHelper.error('Kode rak already exists', status_code=400)
            rak.kode_rak = data['kode_rak']
        
        if 'lokasi' in data:
            rak.lokasi = data['lokasi']
        if 'tipe_rak' in data:
            rak.tipe_rak = data['tipe_rak']
        if 'kapasitas_maksimum' in data:
            rak.kapasitas_maksimum = data['kapasitas_maksimum']
        if 'is_active' in data:
            rak.is_active = data['is_active']
        
        rak.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f'Rak {rak.kode_rak} updated')
        
        return ResponseHelper.success(
            {'id': rak.id, 'kode_rak': rak.kode_rak},
            'Rak updated successfully'
        )
    
    except Exception as e:
        logger.error(f'Update rak error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@rak_bp.route('/<int:rak_id>/lokasi-barang', methods=['POST'])
@jwt_required()
@role_required('admin', 'staff_gudang')
def update_lokasi_barang(rak_id):
    """Update lokasi barang di rak"""
    try:
        rak = Rak.query.get(rak_id)
        if not rak:
            return ResponseHelper.error('Rak not found', status_code=404)
        
        data = request.get_json()
        
        required_fields = ['produk_id', 'qty_di_rak']
        if not all(field in data for field in required_fields):
            return ResponseHelper.error('Missing required fields', status_code=400)
        
        # Check produk exists
        produk = Produk.query.get(data['produk_id'])
        if not produk:
            return ResponseHelper.error('Produk not found', status_code=404)
        
        # Get or create lokasi
        lokasi = LokasiBarang.query.filter_by(
            produk_id=data['produk_id'],
            rak_id=rak_id
        ).first()
        
        if lokasi:
            lokasi.qty_di_rak = data['qty_di_rak']
            lokasi.posisi_detail = data.get('posisi_detail')
        else:
            lokasi = LokasiBarang(
                produk_id=data['produk_id'],
                rak_id=rak_id,
                qty_di_rak=data['qty_di_rak'],
                posisi_detail=data.get('posisi_detail')
            )
            db.session.add(lokasi)
        
        db.session.commit()
        
        logger.info(f'Lokasi barang updated in rak {rak.kode_rak}')
        
        return ResponseHelper.success(
            {'lokasi_id': lokasi.id},
            'Lokasi barang updated successfully'
        )
    
    except Exception as e:
        logger.error(f'Update lokasi barang error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@rak_bp.route('/by-barcode/<barcode_value>', methods=['GET'])
@jwt_required()
def get_rak_by_barcode(barcode_value):
    """Get rak by barcode"""
    try:
        barcode_rak = BarcodeRak.query.filter_by(barcode_value=barcode_value).first()
        
        if not barcode_rak:
            return ResponseHelper.error('Barcode rak not found', status_code=404)
        
        rak = barcode_rak.rak
        
        data = {
            'id': rak.id,
            'kode_rak': rak.kode_rak,
            'lokasi': rak.lokasi,
            'kapasitas_maksimum': rak.kapasitas_maksimum,
            'outlet_id': rak.outlet_id
        }
        
        return ResponseHelper.success(data)
    
    except Exception as e:
        logger.error(f'Get rak by barcode error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)
