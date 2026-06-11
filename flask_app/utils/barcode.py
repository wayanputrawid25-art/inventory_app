# Utility untuk barcode generation
import os
import qrcode
from datetime import datetime
from io import BytesIO
import barcode
from barcode.writer import ImageWriter
from flask import current_app
from flask_app.models import BarcodeProdk, BarcodeRak, db

class BarcodeService:
    """Service untuk generate dan manage barcode"""
    
    @staticmethod
    def generate_product_barcode(kode_barang: str, produk_id: int, format_barcode: str = 'CODE128'):
        """Generate barcode untuk produk"""
        try:
            # Generate barcode value
            barcode_value = f"PRD-{kode_barang}"
            
            # Cek apakah barcode sudah ada
            existing = BarcodeProdk.query.filter_by(produk_id=produk_id).first()
            if existing:
                return existing.barcode_value, None
            
            # Generate barcode file
            barcode_path = BarcodeService._generate_barcode_file(barcode_value, format_barcode, kode_barang)
            
            # Generate QR code
            qr_path = BarcodeService._generate_qr_code(barcode_value, kode_barang)
            
            # Save to database
            barcode_obj = BarcodeProdk(
                produk_id=produk_id,
                barcode_value=barcode_value,
                format_barcode=format_barcode,
                barcode_file_path=barcode_path,
                qr_code_file_path=qr_path,
                is_active=True
            )
            
            db.session.add(barcode_obj)
            db.session.commit()
            
            return barcode_value, barcode_path
        
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def generate_rack_barcode(kode_rak: str, rak_id: int):
        """Generate barcode untuk rak"""
        try:
            barcode_value = f"RAK-{kode_rak}"
            
            # Cek existing
            existing = BarcodeRak.query.filter_by(rak_id=rak_id).first()
            if existing:
                return existing.barcode_value, None
            
            # Generate barcode file
            barcode_path = BarcodeService._generate_barcode_file(barcode_value, 'CODE128', kode_rak)
            
            # Save to database
            barcode_obj = BarcodeRak(
                rak_id=rak_id,
                barcode_value=barcode_value,
                barcode_file_path=barcode_path,
                is_active=True
            )
            
            db.session.add(barcode_obj)
            db.session.commit()
            
            return barcode_value, barcode_path
        
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def _generate_barcode_file(barcode_value: str, format_barcode: str, filename: str):
        """Generate barcode file dan save ke disk"""
        try:
            barcode_folder = current_app.config['BARCODE_FOLDER']
            
            if format_barcode.upper() == 'CODE128':
                # Generate CODE128 barcode
                bc = barcode.get('code128', barcode_value, writer=ImageWriter())
                filepath = os.path.join(barcode_folder, f"{filename}.png")
                bc.save(filepath)
            else:
                # Default fallback
                filepath = os.path.join(barcode_folder, f"{filename}.png")
            
            # Return relative path untuk database
            return f"/static/barcodes/{filename}.png"
        
        except Exception as e:
            raise Exception(f"Error generating barcode: {str(e)}")
    
    @staticmethod
    def _generate_qr_code(barcode_value: str, filename: str):
        """Generate QR code"""
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(barcode_value)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            barcode_folder = current_app.config['BARCODE_FOLDER']
            filepath = os.path.join(barcode_folder, f"{filename}_qr.png")
            img.save(filepath)
            
            return f"/static/barcodes/{filename}_qr.png"
        
        except Exception as e:
            return None
    
    @staticmethod
    def get_barcode_url(produk_id: int):
        """Get barcode URL untuk produk"""
        barcode = BarcodeProdk.query.filter_by(produk_id=produk_id).first()
        if barcode:
            return {
                'barcode_value': barcode.barcode_value,
                'barcode_file': barcode.barcode_file_path,
                'qr_code_file': barcode.qr_code_file_path
            }
        return None
    
    @staticmethod
    def regenerate_barcode(produk_id: int):
        """Regenerate barcode jika perlu"""
        barcode = BarcodeProdk.query.filter_by(produk_id=produk_id).first()
        if barcode:
            barcode.generated_at = datetime.utcnow()
            db.session.commit()
            return True
        return False
    
    @staticmethod
    def update_print_count(produk_id: int):
        """Update print count untuk barcode"""
        barcode = BarcodeProdk.query.filter_by(produk_id=produk_id).first()
        if barcode:
            barcode.print_count += 1
            barcode.last_printed = datetime.utcnow()
            db.session.commit()
            return True
        return False
