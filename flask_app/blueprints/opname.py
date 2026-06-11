# Stock Opname Blueprint
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_app.models import (db, OpnameSession, OpnameDetail, OpnameAdjustment, SelisihAnalisis, 
                               StokRealTime, Produk, Outlet, Rak, BarcodeProdk, OpnameStatusEnum)
from flask_app.utils.auth import role_required
from flask_app.utils.helpers import ResponseHelper, QueryHelper
from datetime import datetime, date
from sqlalchemy import func, and_, or_
import calendar
import logging

opname_bp = Blueprint('opname', __name__)
logger = logging.getLogger(__name__)

@opname_bp.route('/session', methods=['GET'])
@jwt_required()
def list_opname_session():
    """List opname sessions"""
    try:
        outlet_id = request.args.get('outlet_id', type=int)
        bulan = request.args.get('bulan', type=int)
        tahun = request.args.get('tahun', type=int)
        page, per_page = QueryHelper.get_pagination_params(request)
        
        # Filters
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = OpnameSession.query
        
        if outlet_id:
            query = query.filter_by(outlet_id=outlet_id)
        
        if status:
            query = query.filter_by(status=status)
        
        if start_date:
            query = query.filter(OpnameSession.tanggal_opname >= start_date)
        
        if end_date:
            query = query.filter(OpnameSession.tanggal_opname <= end_date)
        
        if bulan and tahun:
            last_day = calendar.monthrange(tahun, bulan)[1]
            query = query.filter(
                OpnameSession.tanggal_opname >= date(tahun, bulan, 1),
                OpnameSession.tanggal_opname <= date(tahun, bulan, last_day)
            )
        
        query = query.order_by(OpnameSession.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page)
        
        data = [{
            'id': s.id,
            'tanggal_opname': s.tanggal_opname.isoformat(),
            'status': str(s.status.value),
            'tipe_opname': s.tipe_opname,
            'total_item_checked': s.total_item_checked,
            'total_item_selisih': s.total_item_selisih,
            'total_qty_selisih': s.total_qty_selisih,
            'checker': s.checker.nama_lengkap if s.checker else 'Unknown',
            'approver': s.approver.nama_lengkap if s.approver else None,
            'started_at': s.started_at.isoformat(),
            'completed_at': s.completed_at.isoformat() if s.completed_at else None,
            'approved_at': s.approved_at.isoformat() if s.approved_at else None
        } for s in pagination.items]
        
        return ResponseHelper.paginated(data, pagination.total, page, per_page)
    
    except Exception as e:
        logger.error(f'List opname session error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@opname_bp.route('/items', methods=['GET'])
@jwt_required()
def get_opname_items():
    """Get list stok item untuk proses opname"""
    try:
        outlet_id = request.args.get('outlet_id', type=int)
        bulan = request.args.get('bulan', type=int)
        tahun = request.args.get('tahun', type=int)
        sku = request.args.get('sku', type=str)
        category = request.args.get('category', type=str)

        query = StokRealTime.query.join(Produk).outerjoin(BarcodeProdk)

        if outlet_id:
            query = query.filter(StokRealTime.outlet_id == outlet_id)

        if sku:
            search_value = f"%{sku}%"
            query = query.filter(or_(
                Produk.kode_barang.ilike(search_value),
                Produk.nama_barang.ilike(search_value),
                BarcodeProdk.barcode_value.ilike(search_value)
            ))

        if category:
            category = category.lower()
            if category == 'modul':
                query = query.filter(Produk.nama_barang.ilike('%modul%'))
            elif category == 'poster':
                query = query.filter(Produk.nama_barang.ilike('%poster%'))
            elif category == 'seragam':
                query = query.filter(or_(Produk.nama_barang.ilike('%seragam%'), Produk.nama_barang.ilike('%my%')))
            else:
                query = query.filter(~Produk.nama_barang.ilike('%modul%'))
                query = query.filter(~Produk.nama_barang.ilike('%poster%'))
                query = query.filter(~Produk.nama_barang.ilike('%seragam%'))

        items = query.order_by(Produk.nama_barang).all()
        data = []

        for item in items:
            rak_code = None
            rak_barcode = None
            kapasitas_rak = None
            if item.produk.lokasi:
                lokasi = item.produk.lokasi[0]
                if lokasi.rak:
                    rak_code = lokasi.rak.kode_rak
                    rak_barcode = lokasi.rak.barcode_rak
                    kapasitas_rak = lokasi.rak.kapasitas_maksimum

            data.append({
                'id': item.id,
                'sku': item.produk.kode_barang,
                'nama_barang': item.produk.nama_barang,
                'kategori': item.produk.kategori.nama_kategori if item.produk.kategori else 'Lain-lain',
                'barcode': item.produk.barcode.barcode_value if item.produk.barcode else None,
                'stok_sistem': item.stok_sistem,
                'qty_stok': item.qty_stok,
                'min_stok': item.produk.min_stok,
                'max_stok': item.produk.max_stok,
                'status_stok': item.status_stok,
                'rak_code': rak_code,
                'rak_barcode': rak_barcode,
                'rak_capacity': kapasitas_rak
            })

        return ResponseHelper.success(data)
    except Exception as e:
        logger.error(f'Get opname items error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@opname_bp.route('/session/batch', methods=['POST'])
@jwt_required()
@role_required('admin', 'checker_opname')
def create_opname_session_batch():
    """Create opname session and details in batch"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        required = ['tanggal_opname', 'items']
        if not all(f in data for f in required):
            return ResponseHelper.error('Missing required fields', status_code=400)

        outlet_id = data.get('outlet_id')
        if outlet_id is None:
            first_stock = StokRealTime.query.first()
            outlet_id = first_stock.outlet_id if first_stock else None

        if not outlet_id:
            return ResponseHelper.error('Outlet tidak tersedia untuk opname', status_code=400)

        outlet = Outlet.query.get(outlet_id)
        if not outlet:
            return ResponseHelper.error('Outlet not found', status_code=404)

        session = OpnameSession(
            outlet_id=outlet_id,
            tanggal_opname=datetime.fromisoformat(data['tanggal_opname']).date(),
            status=OpnameStatusEnum.DRAFT,
            checker_id=user_id,
            tipe_opname=data.get('tipe_opname', 'full'),
            keterangan=data.get('keterangan')
        )
        db.session.add(session)

        for item in data['items']:
            sku = item.get('sku')
            if not sku:
                continue
            produk = Produk.query.filter_by(kode_barang=sku).first()
            if not produk:
                continue

            stok = StokRealTime.query.filter_by(
                produk_id=produk.id,
                outlet_id=outlet_id
            ).first()
            stok_sistem = stok.qty_stok if stok else 0
            stok_fisik = int(item.get('fisik', stok_sistem) or stok_sistem)
            selisih = stok_fisik - stok_sistem
            arah_selisih = 'lebih' if selisih > 0 else 'kurang' if selisih < 0 else 'seimbang'

            detail = OpnameDetail(
                opname_session_id=session.id,
                produk_id=produk.id,
                rak_id=item.get('rak_id'),
                stok_sistem=stok_sistem,
                stok_fisik_input=stok_fisik,
                arah_selisih=arah_selisih,
                catatan_selisih=item.get('catatan_selisih'),
                checked_at=datetime.utcnow()
            )
            db.session.add(detail)
            session.total_item_checked += 1
            if selisih != 0:
                session.total_item_selisih += 1
                session.total_qty_selisih += abs(selisih)

        db.session.commit()

        return ResponseHelper.success(
            {
                'session_id': session.id,
                'tanggal_opname': session.tanggal_opname.isoformat(),
                'total_item_checked': session.total_item_checked,
                'total_item_selisih': session.total_item_selisih,
                'total_qty_selisih': session.total_qty_selisih
            },
            'Opname session created successfully',
            201
        )
    except Exception as e:
        logger.error(f'Create opname batch error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@opname_bp.route('/session', methods=['POST'])
@jwt_required()
@role_required('admin', 'checker_opname')
def create_opname_session():
    """Create opname session"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate
        required = ['outlet_id', 'tanggal_opname']
        if not all(f in data for f in required):
            return ResponseHelper.error('Missing required fields', status_code=400)
        
        # Check outlet
        outlet = Outlet.query.get(data['outlet_id'])
        if not outlet:
            return ResponseHelper.error('Outlet not found', status_code=404)
        
        # Create session
        session = OpnameSession(
            outlet_id=data['outlet_id'],
            tanggal_opname=datetime.fromisoformat(data['tanggal_opname']).date(),
            status=OpnameStatusEnum.DRAFT,
            checker_id=user_id,
            tipe_opname=data.get('tipe_opname', 'full'),
            keterangan=data.get('keterangan')
        )
        
        db.session.add(session)
        db.session.commit()
        
        logger.info(f'Opname session created: {session.id}')
        
        return ResponseHelper.success(
            {
                'session_id': session.id,
                'status': str(session.status.value),
                'tanggal_opname': session.tanggal_opname.isoformat()
            },
            'Opname session created',
            201
        )
    
    except Exception as e:
        logger.error(f'Create opname session error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@opname_bp.route('/session/<int:session_id>/detail', methods=['POST'])
@jwt_required()
@role_required('admin', 'checker_opname')
def add_opname_detail(session_id):
    """Add detail untuk opname session"""
    try:
        user_id = get_jwt_identity()
        session = OpnameSession.query.get(session_id)
        
        if not session:
            return ResponseHelper.error('Opname session not found', status_code=404)
        
        if session.status != OpnameStatusEnum.DRAFT and session.status != OpnameStatusEnum.IN_PROGRESS:
            return ResponseHelper.error('Opname session tidak dalam status editable', status_code=400)
        
        data = request.get_json()
        
        # Validate
        required = ['produk_id', 'stok_sistem', 'stok_fisik_input']
        if not all(f in data for f in required):
            return ResponseHelper.error('Missing required fields', status_code=400)
        
        # Check produk
        produk = Produk.query.get(data['produk_id'])
        if not produk:
            return ResponseHelper.error('Produk not found', status_code=404)
        
        # Get stok sistem dari database
        stok = StokRealTime.query.filter_by(
            produk_id=data['produk_id'],
            outlet_id=session.outlet_id
        ).first()
        
        stok_sistem = stok.qty_stok if stok else 0
        stok_fisik = data['stok_fisik_input']
        selisih = stok_fisik - stok_sistem
        
        # Determine arah selisih
        if selisih > 0:
            arah_selisih = 'lebih'
        elif selisih < 0:
            arah_selisih = 'kurang'
        else:
            arah_selisih = 'seimbang'
        
        # Create detail
        detail = OpnameDetail(
            opname_session_id=session_id,
            produk_id=data['produk_id'],
            rak_id=data.get('rak_id'),
            stok_sistem=stok_sistem,
            stok_fisik_input=stok_fisik,
            arah_selisih=arah_selisih,
            catatan_selisih=data.get('catatan_selisih'),
            checked_at=datetime.utcnow()
        )
        
        db.session.add(detail)
        
        # Update session stats
        session.total_item_checked += 1
        if selisih != 0:
            session.total_item_selisih += 1
            session.total_qty_selisih += abs(selisih)
        
        db.session.commit()
        
        logger.info(f'Opname detail added: {session_id}, produk={data["produk_id"]}')
        
        return ResponseHelper.success(
            {
                'detail_id': detail.id,
                'selisih': selisih,
                'arah_selisih': arah_selisih
            },
            'Opname detail added',
            201
        )
    
    except Exception as e:
        logger.error(f'Add opname detail error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@opname_bp.route('/session/<int:session_id>/complete', methods=['POST'])
@jwt_required()
@role_required('admin', 'checker_opname')
def complete_opname_session(session_id):
    """Complete opname session (change status to completed)"""
    try:
        user_id = get_jwt_identity()
        session = OpnameSession.query.get(session_id)
        
        if not session:
            return ResponseHelper.error('Opname session not found', status_code=404)
        
        if session.status != OpnameStatusEnum.DRAFT and session.status != OpnameStatusEnum.IN_PROGRESS:
            return ResponseHelper.error('Invalid session status', status_code=400)
        
        # Update session
        session.status = OpnameStatusEnum.COMPLETED
        session.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f'Opname session {session_id} completed')
        
        return ResponseHelper.success(
            {
                'session_id': session.id,
                'status': str(session.status.value),
                'completed_at': session.completed_at.isoformat()
            },
            'Opname session completed'
        )
    
    except Exception as e:
        logger.error(f'Complete opname error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@opname_bp.route('/session/<int:session_id>/approve', methods=['POST'])
@jwt_required()
@role_required('admin')
def approve_opname_session(session_id):
    """Approve opname session dan apply stok adjustments"""
    try:
        user_id = get_jwt_identity()
        session = OpnameSession.query.get(session_id)
        
        if not session:
            return ResponseHelper.error('Opname session not found', status_code=404)
        
        if session.status != OpnameStatusEnum.COMPLETED:
            return ResponseHelper.error('Opname must be completed first', status_code=400)
        
        # Get all details dengan selisih
        details_with_selisih = OpnameDetail.query.filter(
            and_(
                OpnameDetail.opname_session_id == session_id,
                OpnameDetail.selisih != 0
            )
        ).all()
        
        # Apply adjustments untuk setiap selisih
        for detail in details_with_selisih:
            # Update stok_real_time
            stok = StokRealTime.query.filter_by(
                produk_id=detail.produk_id,
                outlet_id=session.outlet_id
            ).first()
            
            if stok:
                stok.qty_stok = detail.stok_fisik_input
                stok.stok_fisik = detail.stok_fisik_input
                
                # Verify
                detail.stok_fisik_verified = detail.stok_fisik_input
                detail.verified_at = datetime.utcnow()
        
        # Update session
        session.status = OpnameStatusEnum.APPROVED
        session.approver_id = user_id
        session.approved_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f'Opname session {session_id} approved by user {user_id}')
        
        return ResponseHelper.success(
            {
                'session_id': session.id,
                'status': str(session.status.value),
                'items_adjusted': len(details_with_selisih),
                'approved_at': session.approved_at.isoformat()
            },
            'Opname session approved and stok adjusted'
        )
    
    except Exception as e:
        logger.error(f'Approve opname error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@opname_bp.route('/session/<int:session_id>/detail/<int:detail_id>/analisis', methods=['POST'])
@jwt_required()
@role_required('admin')
def add_analisis_selisih(session_id, detail_id):
    """Add analisis untuk selisih opname"""
    try:
        data = request.get_json()
        
        detail = OpnameDetail.query.get(detail_id)
        if not detail or detail.opname_session_id != session_id:
            return ResponseHelper.error('Opname detail not found', status_code=404)
        
        # Check if already exist
        if detail.analisis:
            return ResponseHelper.error('Analisis already exists for this detail', status_code=400)
        
        analisis = SelisihAnalisis(
            opname_detail_id=detail_id,
            kategori_selisih=data.get('kategori_selisih', 'lainnya'),
            deskripsi=data.get('deskripsi'),
            analisis_root_cause=data.get('analisis_root_cause'),
            tindak_lanjut=data.get('tindak_lanjut'),
            status_tl=data.get('status_tl', 'open')
        )
        
        db.session.add(analisis)
        db.session.commit()
        
        logger.info(f'Analisis added for opname detail {detail_id}')
        
        return ResponseHelper.success(
            {'analisis_id': analisis.id},
            'Analisis selisih added',
            201
        )
    
    except Exception as e:
        logger.error(f'Add analisis error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@opname_bp.route('/session/<int:session_id>/detail', methods=['GET'])
@jwt_required()
def get_opname_details(session_id):
    """Get all details untuk opname session"""
    try:
        session = OpnameSession.query.get(session_id)
        if not session:
            return ResponseHelper.error('Opname session not found', status_code=404)
        
        page, per_page = QueryHelper.get_pagination_params(request)
        
        # Filter hanya yang ada selisih
        selisih_only = request.args.get('selisih_only', 'false').lower() == 'true'
        
        query = OpnameDetail.query.filter_by(opname_session_id=session_id)
        
        if selisih_only:
            query = query.filter(OpnameDetail.selisih != 0)
        
        pagination = query.paginate(page=page, per_page=per_page)
        
        data = [{
            'id': d.id,
            'produk': d.produk_rel.nama_barang,
            'kode_barang': d.produk_rel.kode_barang,
            'stok_sistem': d.stok_sistem,
            'stok_fisik_input': d.stok_fisik_input,
            'stok_fisik_verified': d.stok_fisik_verified,
            'selisih': d.selisih,
            'arah_selisih': d.arah_selisih,
            'catatan_selisih': d.catatan_selisih,
            'checked_at': d.checked_at.isoformat(),
            'analisis': {
                'kategori': d.analisis.kategori_selisih,
                'deskripsi': d.analisis.deskripsi
            } if d.analisis else None
        } for d in pagination.items]
        
        return ResponseHelper.paginated(data, pagination.total, page, per_page)
    
    except Exception as e:
        logger.error(f'Get opname details error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)
