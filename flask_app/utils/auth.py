# Utility functions untuk authentication dan security
import os
import jwt
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from flask_app.models import User, UserSession, db, RoleEnum

class AuthService:
    """Service untuk menangani authentication"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password menggunakan werkzeug"""
        return generate_password_hash(password, method='pbkdf2:sha256')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password"""
        return check_password_hash(hashed, password)
    
    @staticmethod
    def create_tokens(user_id: int, username: str, role: str):
        """Create access dan refresh tokens"""
        additional_claims = {
            'username': username,
            'role': role,
            'user_id': user_id
        }
        
        identity = str(user_id)
        access_token = create_access_token(
            identity=identity,
            additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=identity,
            additional_claims=additional_claims
        )
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds()
        }
    
    @staticmethod
    def login(username: str, password: str, ip_address: str = None, user_agent: str = None, login_as: str = None):
        """Login user with optional admin/user portal validation."""
        normalized_username = (username or '').strip()
        user = User.query.filter_by(username=normalized_username).first()
        
        if not user or not AuthService.verify_password(password or '', user.password_hash):
            if user:
                user.failed_login_count = (user.failed_login_count or 0) + 1
                db.session.commit()
            return None, "Invalid username or password"
        
        if not user.is_active:
            return None, "User account is inactive"

        role = str(user.role.value)
        if login_as == 'admin' and role != 'admin':
            return None, "Portal admin hanya untuk akun admin"
        if login_as == 'user' and role == 'admin':
            return None, "Akun admin harus masuk melalui portal admin"
        
        # Reset failed login count and mark previous sessions inactive so the
        # active session table remains compact and logout state is predictable.
        user.failed_login_count = 0
        user.last_login = datetime.utcnow()
        UserSession.query.filter_by(user_id=user.id, is_active=True).update({
            'is_active': False,
            'logout_at': datetime.utcnow()
        })
        
        tokens = AuthService.create_tokens(user.id, user.username, role)
        token_hash = hashlib.sha256(tokens['access_token'].encode('utf-8')).hexdigest()
        session = UserSession(
            user_id=user.id,
            session_token=token_hash,
            ip_address=ip_address,
            user_agent=(user_agent or '')[:500],
            is_active=True
        )
        
        db.session.add(session)
        db.session.commit()
        
        return {
            'user_id': user.id,
            'username': user.username,
            'nama_lengkap': user.nama_lengkap,
            'role': role,
            'outlet_id': user.outlet_id,
            'login_as': 'admin' if role == 'admin' else 'user',
            **tokens
        }, None
    
    @staticmethod
    def logout(user_id: int):
        """Logout user"""
        session = UserSession.query.filter_by(user_id=user_id, is_active=True).first()
        if session:
            session.is_active = False
            session.logout_at = datetime.utcnow()
            db.session.commit()
        return True
    
    @staticmethod
    def register_user(username: str, email: str, password: str, nama_lengkap: str, role: str = 'staff_gudang'):
        """Register new user"""
        # Check if user exists
        if User.query.filter_by(username=username).first():
            return None, "Username already exists"
        
        if User.query.filter_by(email=email).first():
            return None, "Email already exists"
        
        # normalize role to RoleEnum if possible
        try:
            if isinstance(role, str):
                role_enum = RoleEnum(role.upper()) if role.isupper() else RoleEnum[role.upper()]
            else:
                role_enum = role
        except Exception:
            # fallback: use staff_gudang
            role_enum = RoleEnum.STAFF_GUDANG

        user = User(
            username=username,
            email=email,
            password_hash=AuthService.hash_password(password),
            nama_lengkap=nama_lengkap,
            role=role_enum
        )
        
        try:
            db.session.add(user)
            db.session.commit()
            return user, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)

def login_required(f):
    """Decorator untuk check login"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = int(get_jwt_identity())
            user = User.query.get(current_user_id)
            
            if not user or not user.is_active:
                return jsonify({'error': 'User not found or inactive'}), 401
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 401
    
    return decorated_function

def role_required(*roles):
    """Decorator untuk check role"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            try:
                # Allow bypassing role checks via config for testing environments
                from flask import current_app
                if current_app.config.get('ALLOW_ALL_PERMISSIONS'):
                    return f(*args, **kwargs)

                claims = get_jwt()
                user_role = claims.get('role')

                if user_role not in roles:
                    return jsonify({'error': 'Access denied. Required roles: ' + ', '.join(roles)}), 403

                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({'error': str(e)}), 403
        
        return decorated_function
    return decorator

def outlet_access_required(f):
    """Decorator untuk check outlet access"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            claims = get_jwt()
            user_id = claims.get('user_id')
            user_role = claims.get('role')
            outlet_id = request.args.get('outlet_id', type=int)
            
            if outlet_id is None:
                return jsonify({'error': 'outlet_id parameter required'}), 400
            
            user = User.query.get(user_id)
            
            # Admin bisa access semua outlet
            if user_role == 'admin':
                return f(*args, **kwargs)
            
            # Non-admin hanya bisa access outlet mereka
            if user.outlet_id and user.outlet_id != outlet_id:
                return jsonify({'error': 'Access denied to this outlet'}), 403
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 403
    
    return decorated_function
