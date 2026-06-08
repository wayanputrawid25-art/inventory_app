# Configuration file for Flask Application
import os
from datetime import timedelta


def _build_database_uri(env_var='DATABASE_URL'):
    """Build SQLAlchemy database URI from Neon/Postgres or legacy MySQL env."""
    database_url = os.environ.get(env_var)

    if database_url:
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql+psycopg2://', 1)
        elif database_url.startswith('postgresql://'):
            database_url = database_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
        return database_url

    db_host = os.environ.get('DB_HOST', 'localhost')
    db_user = os.environ.get('DB_USER', 'app_user')
    db_password = os.environ.get('DB_PASSWORD', 'password')
    db_name = os.environ.get('DB_NAME', 'cv_epic_warehouse_mysql')
    db_port = int(os.environ.get('DB_PORT', 3306))
    return f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"


class Config:
    """Base configuration"""
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = False
    TESTING = False
    JSON_SORT_KEYS = False
    
    # Database
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_USER = os.environ.get('DB_USER', 'app_user')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'password')
    DB_NAME = os.environ.get('DB_NAME', 'cv_epic_warehouse_mysql')
    DB_PORT = int(os.environ.get('DB_PORT', 3306))
    
    SQLALCHEMY_DATABASE_URI = _build_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Upload paths
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static/uploads')
    BARCODE_FOLDER = os.path.join(os.path.dirname(__file__), 'static/barcodes')
    REPORT_FOLDER = os.path.join(os.path.dirname(__file__), 'static/reports')
    
    # Create folders if not exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(BARCODE_FOLDER, exist_ok=True)
    os.makedirs(REPORT_FOLDER, exist_ok=True)
    
    # Pagination
    ITEMS_PER_PAGE = 20
    
    # Barcode generation
    BARCODE_FORMAT = 'CODE128'  # CODE128, EAN13, UPC
    QR_CODE_ENABLED = True
    
    # API versioning
    API_VERSION = 'v1'
    API_PREFIX = f'/api/{API_VERSION}'

    # Development / testing helpers
    # When true, role checks are bypassed (useful for rapid testing). Do NOT enable in production.
    ALLOW_ALL_PERMISSIONS = os.environ.get('ALLOW_ALL_PERMISSIONS', 'false').lower() in ('1', 'true', 'yes')
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', 'app.log')
    
    # Session
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SESSION_COOKIE_SECURE = False
    # Use a lightweight SQLite database for local development to avoid
    # requiring external DB servers and native drivers (psycopg2).
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or (
        f"sqlite:///{os.path.join(os.path.dirname(__file__), 'dev.db')}"
    )


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DB_NAME = 'cv_epic_warehouse_test'
    SQLALCHEMY_DATABASE_URI = (
        _build_database_uri('TEST_DATABASE_URL')
        if os.environ.get('TEST_DATABASE_URL')
        else f"mysql+pymysql://{Config.DB_USER}:{Config.DB_PASSWORD}@"
             f"{Config.DB_HOST}:{Config.DB_PORT}/{DB_NAME}"
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=300)
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Required env vars in production: defer checks until FLASK_ENV indicates production
    if os.environ.get('FLASK_ENV') == 'production':
        if not os.environ.get('SECRET_KEY'):
            raise ValueError('SECRET_KEY must be set in production')
        if not os.environ.get('JWT_SECRET_KEY'):
            raise ValueError('JWT_SECRET_KEY must be set in production')


# Config selector
def get_config():
    """Get configuration based on FLASK_ENV"""
    env = os.environ.get('FLASK_ENV', 'development')
    
    config_map = {
        'development': DevelopmentConfig,
        'testing': TestingConfig,
        'production': ProductionConfig
    }
    
    return config_map.get(env, DevelopmentConfig)


config = get_config()
