# Barcode Management Blueprint
from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required
from flask_app.models import db, Produk, BarcodeProdk, BarcodeRak, BarcodesScanHistory
from flask_app.utils.auth import role_required
from flask_app.utils.barcode import BarcodeService
from flask_app.utils.helpers import ResponseHelper
from datetime import datetime
import os
import logging

barcode_bp = Blueprint('barcode', __name__)
logger = logging.getLogger(__name__)

@barcode_bp.route('/generate-produk/<int:produk_id>', methods=['POST'])
@jwt_required()
@role_required('admin')
def generate_produk_barcode(produk_id):
    """Generate barcode untuk produk"""
    try:
        produk = Produk.query.get(produk_id)
        if not produk:
            return ResponseHelper.error('Produk not found', status_code=404)
        
        # Generate barcode
        barcode_value, barcode_path = BarcodeService.generate_product_barcode(
            produk.kode_barang,
            produk_id
        )
        
        if not barcode_value:
            return ResponseHelper.error(barcode_path, status_code=500)
        
        logger.info(f'Barcode generated for produk {produk_id}')
        
        return ResponseHelper.success(
            {
                'produk_id': produk_id,
                'barcode_value': barcode_value,
                'barcode_file': barcode_path,
                'generated_at': datetime.utcnow().isoformat()
            },
            'Barcode generated successfully',
            201
        )
    
    except Exception as e:
        logger.error(f'Generate barcode error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@barcode_bp.route('/produk/<int:produk_id>/url', methods=['GET'])
@jwt_required()
def get_produk_barcode_url(produk_id):
    """Get barcode file URL untuk produk"""
    try:
        produk = Produk.query.get(produk_id)
        if not produk:
            return ResponseHelper.error('Produk not found', status_code=404)
        
        barcode_info = BarcodeService.get_barcode_url(produk_id)
        
        if not barcode_info:
            return ResponseHelper.error('Barcode not found', status_code=404)
        
        return ResponseHelper.success(barcode_info)
    
    except Exception as e:
        logger.error(f'Get barcode URL error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@barcode_bp.route('/produk/<int:produk_id>/download', methods=['GET'])
@jwt_required()
def download_produk_barcode(produk_id):
    """Download barcode image untuk produk"""
    try:
        produk = Produk.query.get(produk_id)
        if not produk:
            return ResponseHelper.error('Produk not found', status_code=404)
        
        barcode = BarcodeProdk.query.filter_by(produk_id=produk_id).first()
        if not barcode or not barcode.barcode_file_path:
            return ResponseHelper.error('Barcode file not found', status_code=404)
        
        # Get file path
        file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 
                                 barcode.barcode_file_path.replace('/static/', ''))
        
        if not os.path.exists(file_path):
            return ResponseHelper.error('Barcode file not found', status_code=404)
        
        # Update print count
        BarcodeService.update_print_count(produk_id)
        
        logger.info(f'Barcode downloaded for produk {produk_id}')
        
        return send_file(file_path, as_attachment=True, 
                        download_name=f'{produk.kode_barang}_barcode.png')
    
    except Exception as e:
        logger.error(f'Download barcode error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@barcode_bp.route('/produk/bulk-generate', methods=['POST'])
@jwt_required()
@role_required('admin')
def bulk_generate_barcodes():
    """Generate barcode untuk multiple produk"""
    try:
        data = request.get_json()
        produk_ids = data.get('produk_ids', [])
        
        if not produk_ids:
            return ResponseHelper.error('produk_ids required', status_code=400)
        
        results = []
        errors = []
        
        for produk_id in produk_ids:
            try:
                produk = Produk.query.get(produk_id)
                if not produk:
                    errors.append({'produk_id': produk_id, 'error': 'Not found'})
                    continue
                
                barcode_value, barcode_path = BarcodeService.generate_product_barcode(
                    produk.kode_barang,
                    produk_id
                )
                
                if barcode_value:
                    results.append({
                        'produk_id': produk_id,
                        'kode_barang': produk.kode_barang,
                        'barcode_value': barcode_value,
                        'status': 'success'
                    })
                else:
                    errors.append({'produk_id': produk_id, 'error': barcode_path})
            
            except Exception as e:
                errors.append({'produk_id': produk_id, 'error': str(e)})
        
        logger.info(f'Bulk barcode generation: {len(results)} success, {len(errors)} errors')
        
        return ResponseHelper.success(
            {
                'success_count': len(results),
                'error_count': len(errors),
                'results': results,
                'errors': errors
            },
            'Bulk barcode generation completed',
            200
        )
    
    except Exception as e:
        logger.error(f'Bulk generate barcode error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@barcode_bp.route('/scan-history', methods=['GET'])
@jwt_required()
def get_scan_history():
    """Get scan history"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        limit = request.args.get('limit', 50, type=int)
        tipe_scan = request.args.get('tipe_scan')
        
        query = BarcodesScanHistory.query.filter_by(user_id=user_id).order_by(
            BarcodesScanHistory.scanned_at.desc()
        )
        
        if tipe_scan:
            query = query.filter_by(tipe_scan=tipe_scan)
        
        history = query.limit(limit).all()
        
        data = [{
            'id': h.id,
            'barcode_value': h.barcode_value,
            'tipe_scan': h.tipe_scan,
            'scan_result': h.scan_result,
            'scanned_at': h.scanned_at.isoformat()
        } for h in history]
        
        return ResponseHelper.success(data)
    
    except Exception as e:
        logger.error(f'Get scan history error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)
