# Authentication Blueprint
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from flask_app.models import db, User, UserSession
from flask_app.utils.auth import AuthService
from flask_app.utils.helpers import ResponseHelper, validate_json
from datetime import datetime
import logging

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

def _login_with_portal(login_as=None):
    """Shared login handler. login_as can be admin, user, or None."""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        user_agent = request.headers.get('User-Agent', '')
        
        user_data, error = AuthService.login(username, password, ip_address, user_agent, login_as=login_as)
        
        if error:
            logger.warning(f'Login failed for user {username}: {error}')
            return ResponseHelper.error(error, status_code=401)
        
        logger.info(f'User {username} logged in successfully via {login_as or "default"} portal')
        return ResponseHelper.success(user_data, 'Login successful', 200)
    
    except Exception as e:
        logger.error(f'Login error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@auth_bp.route('/login', methods=['POST'])
@validate_json(['username', 'password'])
def login():
    """Backward-compatible login endpoint."""
    return _login_with_portal(None)

@auth_bp.route('/login/admin', methods=['POST'])
@validate_json(['username', 'password'])
def login_admin():
    """Admin-only login endpoint."""
    return _login_with_portal('admin')

@auth_bp.route('/login/user', methods=['POST'])
@validate_json(['username', 'password'])
def login_user():
    """Operational user login endpoint. Admin accounts use /login/admin."""
    return _login_with_portal('user')

@auth_bp.route('/register', methods=['POST'])
@validate_json(['username', 'email', 'password', 'nama_lengkap'])
def register():
    """Register new user endpoint"""
    try:
        data = request.get_json()
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        nama_lengkap = data.get('nama_lengkap')
        role = data.get('role', 'staff_gudang')
        
        # Validate role
        valid_roles = ['staff_gudang', 'checker_opname', 'admin']
        if role not in valid_roles:
            return ResponseHelper.error(f'Invalid role. Must be one of: {", ".join(valid_roles)}', status_code=400)
        
        # Validate password strength
        if len(password) < 6:
            return ResponseHelper.error('Password must be at least 6 characters', status_code=400)
        
        # Register user
        user, error = AuthService.register_user(username, email, password, nama_lengkap, role)
        
        if error:
            logger.warning(f'Registration failed: {error}')
            return ResponseHelper.error(error, status_code=400)
        
        logger.info(f'New user {username} registered')
        return ResponseHelper.success(
            {
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'nama_lengkap': user.nama_lengkap,
                'role': user.role.value
            },
            'Registration successful',
            201
        )
    
    except Exception as e:
        logger.error(f'Registration error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout endpoint"""
    try:
        user_id = int(get_jwt_identity())
        
        # Logout user
        AuthService.logout(user_id)
        
        logger.info(f'User {user_id} logged out')
        return ResponseHelper.success(None, 'Logout successful', 200)
    
    except Exception as e:
        logger.error(f'Logout error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        user = User.query.get(user_id)
        
        if not user:
            return ResponseHelper.error('User not found', status_code=404)
        
        return ResponseHelper.success(
            {
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'nama_lengkap': user.nama_lengkap,
                'role': str(user.role.value),
                'outlet_id': user.outlet_id,
                'is_active': user.is_active,
                'last_login': user.last_login.isoformat() if user.last_login else None
            },
            'User info retrieved'
        )
    
    except Exception as e:
        logger.error(f'Get user error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
@validate_json(['old_password', 'new_password'])
def change_password():
    """Change user password"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        user = User.query.get(user_id)
        if not user:
            return ResponseHelper.error('User not found', status_code=404)
        
        # Verify old password
        if not AuthService.verify_password(old_password, user.password_hash):
            return ResponseHelper.error('Invalid old password', status_code=401)
        
        # Validate new password
        if len(new_password) < 6:
            return ResponseHelper.error('New password must be at least 6 characters', status_code=400)
        
        # Update password
        user.password_hash = AuthService.hash_password(new_password)
        db.session.commit()
        
        logger.info(f'User {user.username} changed password')
        return ResponseHelper.success(None, 'Password changed successfully', 200)
    
    except Exception as e:
        logger.error(f'Change password error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return ResponseHelper.error('User not found or inactive', status_code=401)
        
        # Create new tokens
        tokens = AuthService.create_tokens(user.id, user.username, str(user.role.value))
        
        return ResponseHelper.success(tokens, 'Token refreshed', 200)
    
    except Exception as e:
        logger.error(f'Token refresh error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@auth_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    """Get user sessions"""
    try:
        user_id = int(get_jwt_identity())
        
        sessions = UserSession.query.filter_by(user_id=user_id, is_active=True).all()
        
        return ResponseHelper.success(
            [
                {
                    'session_id': s.id,
                    'login_at': s.login_at.isoformat(),
                    'ip_address': s.ip_address,
                    'user_agent': s.user_agent[:50]  # Truncate for display
                }
                for s in sessions
            ],
            'Sessions retrieved'
        )
    
    except Exception as e:
        logger.error(f'Get sessions error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)

@auth_bp.route('/logout-all', methods=['POST'])
@jwt_required()
def logout_all_sessions():
    """Logout semua sessions user"""
    try:
        user_id = int(get_jwt_identity())
        
        sessions = UserSession.query.filter_by(user_id=user_id, is_active=True).all()
        
        for session in sessions:
            session.is_active = False
            session.logout_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f'User {user_id} logged out from all sessions')
        return ResponseHelper.success(None, 'Logged out from all sessions', 200)
    
    except Exception as e:
        logger.error(f'Logout all error: {str(e)}')
        db.session.rollback()
        return ResponseHelper.error(str(e), status_code=500)
