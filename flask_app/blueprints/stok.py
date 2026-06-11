# Stock Management Blueprint
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_app.models import db, StokMutasi, StokRealTime, Produk, Outlet, Notifikasi, TransaksiTypeEnum
from flask_app.utils.auth import role_required
from flask_app.utils.helpers import ResponseHelper, QueryHelper
from datetime import datetime, date
from sqlalchemy import func, and_
import logging

stok_bp = Blueprint('stok', __name__)
logger = logging.getLogger(__name__)

@stok_bp.route('/real-time', methods=['GET'])
@jwt_required()
def get_stok_real_time():
    """Get real-time stok per produk di outlet"""
    try:
        outlet_id = request.args.get('outlet_id', type=int)
        page, per_page = QueryHelper.get_pagination_params(request)
        
        if not outlet_id:
            return ResponseHelper.error('outlet_id required', status_code=400)
        
        query = StokRealTime.query.filter_by(outlet_id=outlet_id)
        
        # Filter
        status_stok = request.args.get('status_stok')
        if status_stok:
            query = query.filter_by(status_stok=status_stok)
        
        pagination = query.paginate(page=page, per_page=per_page)
        
        data = [{
            'id': s.id,
            'produk_id': s.produk_id,
            'kode_barang': s.produk.kode_barang,
            'nama_barang': s.produk.nama_barang,
            'qty_stok': s.qty_stok,
            'stok_sistem': s.stok_sistem,
            'stok_fisik': s.stok_fisik,
            'status_stok': s.status_stok,
            'min_stok': s.produk.min_stok,
            'max_stok': s.produk.max_stok,
            'is_below_minimum': s.qty_stok <= s.produk.min_stok,
            'last_opname': s.last_opname.isoformat() if s.last_opname else None
        } for s in pagination.items]
        
        return ResponseHelper.paginated(data, pagination.total, page, per_page)
    
    except Exception as e:
        logger.error(f'Get stok real-time error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@stok_bp.route('/mutasi', methods=['GET'])
@jwt_required()
def list_mutasi():
    """List stock mutations/transactions"""
    try:
        outlet_id = request.args.get('outlet_id', type=int)
        page, per_page = QueryHelper.get_pagination_params(request)
        
        if not outlet_id:
            return ResponseHelper.error('outlet_id required', status_code=400)
        
        # Filters
        tipe_mutasi = request.args.get('tipe_mutasi')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = StokMutasi.query.filter_by(outlet_id=outlet_id)
        
        if tipe_mutasi:
            query = query.filter_by(tipe_mutasi=tipe_mutasi)
        
        if start_date:
            query = query.filter(StokMutasi.tanggal_mutasi >= start_date)
        
        if end_date:
            query = query.filter(StokMutasi.tanggal_mutasi <= end_date)
        
        query = query.order_by(StokMutasi.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page)
        
        data = [{
            'id': m.id,
            'produk': m.produk.nama_barang,
            'kode_barang': m.produk.kode_barang,
            'tipe_mutasi': str(m.tipe_mutasi.value),
            'qty': m.qty,
            'qty_sebelum': m.qty_sebelum,
            'qty_sesudah': m.qty_sesudah,
            'tanggal_mutasi': m.tanggal_mutasi.isoformat(),
            'user': m.user.nama_lengkap if m.user else 'System',
            'keterangan': m.keterangan,
            'reference_type': m.reference_type,
            'is_approved': m.is_approved,
            'created_at': m.created_at.isoformat()
        } for m in pagination.items]
        
        return ResponseHelper.paginated(data, pagination.total, page, per_page)
    
    except Exception as e:
        logger.error(f'List mutasi error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@stok_bp.route('/mutasi', methods=['POST'])
@jwt_required()
@role_required('admin', 'staff_gudang')
def create_mutasi():
    """Create stock mutation"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate
        required = ['outlet_id', 'produk_id', 'tipe_mutasi', 'qty', 'tanggal_mutasi']
        if not all(f in data for f in required):
            return ResponseHelper.error('Missing required fields', status_code=400)
        
        # Cek produk dan outlet
        produk = Produk.query.get(data['produk_id'])
        outlet = Outlet.query.get(data['outlet_id'])
        
        if not produk or not outlet:
            return ResponseHelper.error('Produk or outlet not found', status_code=404)
        
        # Get current stok
        stok = StokRealTime.query.filter_by(
            produk_id=data['produk_id'],
            outlet_id=data['outlet_id']
        ).first()
        
        qty_sebelum = stok.qty_stok if stok else 0
        qty = data['qty']
        
        # Calculate qty_sesudah based on tipe_mutasi
        if data['tipe_mutasi'] == 'barang_keluar':
            qty_sesudah = qty_sebelum - qty
        else:  # barang_masuk, stok_awal, adjustment
            qty_sesudah = qty_sebelum + qty
        
        # Create mutasi record
        mutasi = StokMutasi(
            outlet_id=data['outlet_id'],
            produk_id=data['produk_id'],
            tipe_mutasi=data['tipe_mutasi'],
            qty=qty,
            qty_sebelum=qty_sebelum,
            qty_sesudah=qty_sesudah,
            tanggal_mutasi=datetime.fromisoformat(data['tanggal_mutasi']).date(),
            user_id=user_id,
            rak_id=data.get('rak_id'),
            keterangan=data.get('keterangan'),
            reference_type=data.get('reference_type')
        )
        
        db.session.add(mutasi)
        
        # Update or create stok_real_time
        if stok:
            stok.qty_stok = qty_sesudah
            stok.stok_sistem = qty_sesudah
            # Update status
            if qty_sesudah <= produk.min_stok:
                stok.status_stok = 'minimum' if qty_sesudah > 0 else 'habis'
            elif qty_sesudah >= produk.max_stok:
                stok.status_stok = 'overstock'
            else:
                stok.status_stok = 'aman'
        else:
            stok = StokRealTime(
                produk_id=data['produk_id'],
                outlet_id=data['outlet_id'],
                qty_stok=qty_sesudah,
                stok_sistem=qty_sesudah,
                status_stok='aman'
            )
            db.session.add(stok)
        
        # Check notifications
        if qty_sesudah <= produk.min_stok:
            notif = Notifikasi(
                user_id=user_id,
                tipe_notifikasi='stok_minimum',
                produk_id=data['produk_id'],
                outlet_id=data['outlet_id'],
                pesan=f'{produk.nama_barang} stok di bawah minimum ({qty_sesudah} < {produk.min_stok})',
                severity='warning'
            )
            db.session.add(notif)
        
        db.session.commit()
        
        logger.info(f'Mutasi created: {data["tipe_mutasi"]} for {produk.nama_barang} qty={qty}')
        
        return ResponseHelper.success(
            {
                'mutasi_id': mutasi.id,
                'qty_sesudah': qty_sesudah,
                'status_stok': stok.status_stok
            },
            'Mutasi created successfully',
            201
        )
    
    except Exception as e:
        logger.error(f'Create mutasi error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@stok_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_stok_summary():
    """Get stock summary untuk outlet"""
    try:
        outlet_id = request.args.get('outlet_id', type=int)
        
        if not outlet_id:
            return ResponseHelper.error('outlet_id required', status_code=400)
        
        # Summary queries
        total_produk = db.session.query(func.count(StokRealTime.id)).filter(
            StokRealTime.outlet_id == outlet_id
        ).scalar() or 0
        
        total_qty = db.session.query(func.sum(StokRealTime.qty_stok)).filter(
            StokRealTime.outlet_id == outlet_id
        ).scalar() or 0
        
        item_minimum = db.session.query(func.count(StokRealTime.id)).filter(
            and_(
                StokRealTime.outlet_id == outlet_id,
                StokRealTime.status_stok.in_(['minimum', 'habis'])
            )
        ).scalar() or 0
        
        item_overstock = db.session.query(func.count(StokRealTime.id)).filter(
            and_(
                StokRealTime.outlet_id == outlet_id,
                StokRealTime.status_stok == 'overstock'
            )
        ).scalar() or 0
        
        data = {
            'total_produk': total_produk,
            'total_qty': total_qty,
            'item_minimum': item_minimum,
            'item_overstock': item_overstock,
            'item_aman': total_produk - item_minimum - item_overstock,
            'persentase_minimum': round((item_minimum / total_produk * 100), 2) if total_produk > 0 else 0
        }
        
        return ResponseHelper.success(data)
    
    except Exception as e:
        logger.error(f'Get stok summary error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)
