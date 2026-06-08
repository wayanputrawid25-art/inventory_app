# Main Flask Application
import os
import logging
import pkgutil
# Compatibility shim: some Python versions remove pkgutil.get_loader.
# Provide a fallback using importlib.spec if missing so Flask can locate packages.
if not hasattr(pkgutil, 'get_loader'):
    import importlib.util
    def _compat_get_loader(name):
        try:
            if name == '__main__':
                return None
            spec = importlib.util.find_spec(name)
        except ValueError:
            return None
        return None if spec is None else spec.loader
    pkgutil.get_loader = _compat_get_loader

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_app.models import db
from config import config
from datetime import datetime

def create_app():
    """Application factory"""
    
    # Load configuration
    cfg = config
    
    # Create Flask app
    app = Flask(__name__, static_folder='static', static_url_path='/static')
    app.config.from_object(cfg)
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": cfg.CORS_ORIGINS}})
    
    # Setup logging
    setup_logging(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Health check
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0'
        }), 200
    
    return app

def setup_logging(app):
    """Setup logging configuration"""
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO'))
    
    # File handler
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    file_handler = logging.FileHandler(app.config.get('LOG_FILE', 'logs/app.log'))
    file_handler.setLevel(log_level)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Add handlers
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(log_level)

def register_error_handlers(app):
    """Register error handlers"""
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Resource not found',
            'timestamp': datetime.utcnow().isoformat()
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Internal error: {str(error)}')
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'timestamp': datetime.utcnow().isoformat()
        }), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'message': 'Bad request',
            'timestamp': datetime.utcnow().isoformat()
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'success': False,
            'message': 'Unauthorized',
            'timestamp': datetime.utcnow().isoformat()
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'success': False,
            'message': 'Access forbidden',
            'timestamp': datetime.utcnow().isoformat()
        }), 403

def register_blueprints(app):
    """Register Flask blueprints"""
    
    # Import blueprints
    from flask_app.blueprints.auth import auth_bp
    from flask_app.blueprints.produk import produk_bp
    from flask_app.blueprints.rak import rak_bp
    from flask_app.blueprints.stok import stok_bp
    from flask_app.blueprints.opname import opname_bp
    from flask_app.blueprints.barcode import barcode_bp
    from flask_app.blueprints.scan import scan_bp
    from flask_app.blueprints.dashboard import dashboard_bp
    from flask_app.blueprints.report import report_bp
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(produk_bp, url_prefix='/api/v1/produk')
    app.register_blueprint(rak_bp, url_prefix='/api/v1/rak')
    app.register_blueprint(stok_bp, url_prefix='/api/v1/stok')
    app.register_blueprint(opname_bp, url_prefix='/api/v1/opname')
    app.register_blueprint(barcode_bp, url_prefix='/api/v1/barcode')
    app.register_blueprint(scan_bp, url_prefix='/api/v1/scan')
    app.register_blueprint(dashboard_bp, url_prefix='/api/v1/dashboard')
    app.register_blueprint(report_bp, url_prefix='/api/v1/report')

if __name__ == '__main__':
    app = create_app()
    app.run(
        host=os.environ.get('API_HOST', '0.0.0.0'),
        port=int(os.environ.get('API_PORT', 5000)),
        debug=os.environ.get('FLASK_ENV') == 'development'
    )
