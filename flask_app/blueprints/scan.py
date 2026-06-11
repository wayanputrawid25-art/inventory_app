# Scanner/Scanning Blueprint
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_app.models import db, TransaksiScan, Produk, Rak, BarcodeProdk, BarcodeRak, BarcodesScanHistory, Outlet
from flask_app.utils.auth import role_required
from flask_app.utils.helpers import ResponseHelper
from datetime import datetime, date
import logging
import json

scan_bp = Blueprint('scan', __name__)
logger = logging.getLogger(__name__)

@scan_bp.route('/barcode', methods=['POST'])
@jwt_required()
@role_required('admin', 'staff_gudang', 'checker_opname')
def scan_barcode():
    """Scan barcode (produk atau rak)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        barcode_value = data.get('barcode_value', '').strip()
        outlet_id = data.get('outlet_id', type=int)
        
        if not barcode_value or not outlet_id:
            return ResponseHelper.error('barcode_value and outlet_id required', status_code=400)
        
        # Determine tipe dari barcode value
        tipe_scan = None
        produk = None
        rak = None
        
        if barcode_value.startswith('PRD-'):
            # Produk barcode
            barcode_prod = BarcodeProdk.query.filter_by(barcode_value=barcode_value).first()
            if barcode_prod:
                produk = barcode_prod.produk
                tipe_scan = 'produk'
        
        elif barcode_value.startswith('RAK-'):
            # Rak barcode
            barcode_r = BarcodeRak.query.filter_by(barcode_value=barcode_value).first()
            if barcode_r:
                rak = barcode_r.rak
                tipe_scan = 'rak'
        
        else:
            # Try to find by kode
            produk = Produk.query.filter_by(kode_barang=barcode_value).first()
            if produk:
                tipe_scan = 'produk'
            else:
                rak = Rak.query.filter_by(kode_rak=barcode_value).first()
                if rak:
                    tipe_scan = 'rak'
        
        # Record scan history
        scan_hist = BarcodesScanHistory(
            user_id=user_id,
            barcode_value=barcode_value,
            tipe_scan=tipe_scan or 'unknown',
            scan_result='success' if tipe_scan else 'not_found',
            scanned_at=datetime.utcnow()
        )
        db.session.add(scan_hist)
        
        if not tipe_scan:
            db.session.commit()
            return ResponseHelper.error('Barcode not found', status_code=404)
        
        # Return scan result
        result = {
            'barcode_value': barcode_value,
            'tipe_scan': tipe_scan,
            'scanned_at': datetime.utcnow().isoformat()
        }
        
        if produk:
            result['produk'] = {
                'id': produk.id,
                'kode_barang': produk.kode_barang,
                'nama_barang': produk.nama_barang,
                'harga_jual': float(produk.harga_jual)
            }
        
        if rak:
            result['rak'] = {
                'id': rak.id,
                'kode_rak': rak.kode_rak,
                'lokasi': rak.lokasi,
                'kapasitas_maksimum': rak.kapasitas_maksimum,
                'outlet_id': rak.outlet_id
            }
        
        db.session.commit()
        
        logger.info(f'Barcode scanned: {barcode_value}, type={tipe_scan}')
        
        return ResponseHelper.success(result)
    
    except Exception as e:
        logger.error(f'Scan barcode error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@scan_bp.route('/transaksi', methods=['POST'])
@jwt_required()
@role_required('admin', 'staff_gudang')
def create_scan_transaksi():
    """Create transaksi from scan"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required = ['outlet_id', 'tipe_transaksi', 'produk_id', 'qty']
        if not all(f in data for f in required):
            return ResponseHelper.error('Missing required fields', status_code=400)
        
        # Validate
        outlet = Outlet.query.get(data['outlet_id'])
        produk = Produk.query.get(data['produk_id'])
        
        if not outlet or not produk:
            return ResponseHelper.error('Outlet or produk not found', status_code=404)
        
        # Validate qty
        qty = data.get('qty', 0)
        if qty <= 0:
            return ResponseHelper.error('Qty must be greater than 0', status_code=400)
        
        # Create scan transaksi record
        scan_transaksi = TransaksiScan(
            outlet_id=data['outlet_id'],
            tipe_transaksi=data['tipe_transaksi'],
            rak_id=data.get('rak_id'),
            produk_id=data['produk_id'],
            qty=qty,
            scan_data_json=json.dumps(data.get('scan_data', {})),
            user_id=user_id,
            is_valid=True,
            tanggal_transaksi=date.today(),
            validation_message='Valid'
        )
        
        db.session.add(scan_transaksi)
        db.session.commit()
        
        logger.info(f'Scan transaksi created: {data["tipe_transaksi"]} qty={qty}')
        
        return ResponseHelper.success(
            {
                'scan_id': scan_transaksi.id,
                'produk': produk.nama_barang,
                'qty': qty,
                'status': 'valid'
            },
            'Scan transaksi created',
            201
        )
    
    except Exception as e:
        logger.error(f'Create scan transaksi error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@scan_bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_scans():
    """Get pending scan transactions"""
    try:
        outlet_id = request.args.get('outlet_id', type=int)
        
        if not outlet_id:
            return ResponseHelper.error('outlet_id required', status_code=400)
        
        scans = TransaksiScan.query.filter(
            TransaksiScan.outlet_id == outlet_id,
            TransaksiScan.is_valid == True
        ).order_by(TransaksiScan.created_at.desc()).limit(100).all()
        
        data = [{
            'id': s.id,
            'produk': s.produk_id.nama_barang if s.produk_id else 'Unknown',
            'qty': s.qty,
            'tipe_transaksi': s.tipe_transaksi,
            'created_at': s.created_at.isoformat()
        } for s in scans if s.produk_id]
        
        return ResponseHelper.success(data)
    
    except Exception as e:
        logger.error(f'Get pending scans error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@scan_bp.route('/clear-pending', methods=['POST'])
@jwt_required()
@role_required('admin', 'staff_gudang')
def clear_pending_scans():
    """Clear pending scan transactions"""
    try:
        outlet_id = request.args.get('outlet_id', type=int)
        
        if not outlet_id:
            return ResponseHelper.error('outlet_id required', status_code=400)
        
        TransaksiScan.query.filter_by(outlet_id=outlet_id, is_valid=True).delete()
        db.session.commit()
        
        logger.info(f'Pending scans cleared for outlet {outlet_id}')
        
        return ResponseHelper.success(None, 'Pending scans cleared')
    
    except Exception as e:
        logger.error(f'Clear pending scans error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)
