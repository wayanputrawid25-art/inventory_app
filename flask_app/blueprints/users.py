# User Management Blueprint
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_app.models import db, User
from flask_app.utils.auth import AuthService
from flask_app.utils.helpers import ResponseHelper, validate_json
from datetime import datetime
from sqlalchemy import or_
import logging

users_bp = Blueprint('users', __name__)
logger = logging.getLogger(__name__)

# ============================================
# GET /users - List all users
# ============================================

@users_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        role = request.args.get('role', '')
        status = request.args.get('status', '')
        
        # Build query
        query = User.query
        
        # Search filter
        if search:
            query = query.filter(
                or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    User.nama_lengkap.ilike(f'%{search}%')
                )
            )
        
        # Role filter
        if role:
            query = query.filter(User.role == role)
        
        # Status filter (is_active)
        if status:
            is_active = status == 'active'
            query = query.filter(User.is_active == is_active)
        
        # Order by created_at desc
        query = query.order_by(User.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        users = pagination.items
        
        # Format response
        data = [{
            'id': u.id,
            'name': u.nama_lengkap,
            'username': u.username,
            'email': u.email,
            'role': str(u.role.value) if u.role else 'staff_gudang',
            'is_active': u.is_active,
            'last_login': u.last_login.isoformat() if u.last_login else None,
            'created_at': u.created_at.isoformat()
        } for u in users]
        
        return ResponseHelper.success({
            'users': data,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        })
    
    except Exception as e:
        logger.error(f'Get users error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)


# ============================================
# GET /users/<id> - Get single user
# ============================================

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get single user by ID"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return ResponseHelper.error('User not found', status_code=404)
        
        return ResponseHelper.success({
            'id': user.id,
            'name': user.nama_lengkap,
            'username': user.username,
            'email': user.email,
            'role': str(user.role.value) if user.role else 'staff_gudang',
            'is_active': user.is_active,
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'created_at': user.created_at.isoformat(),
            'updated_at': user.updated_at.isoformat() if user.updated_at else None
        })
    
    except Exception as e:
        logger.error(f'Get user error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)


# ============================================
# POST /users - Create new user
# ============================================

@users_bp.route('', methods=['POST'])
@jwt_required()
@validate_json(['username', 'email', 'password', 'name', 'role'])
def create_user():
    """Create new user"""
    try:
        # Check if current user is admin
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user or str(current_user.role.value) != 'admin':
            return ResponseHelper.error('Unauthorized. Admin role required', status_code=403)
        
        data = request.get_json()
        
        # Validate required fields
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        role = data.get('role', 'staff_gudang')
        
        # Validate role
        valid_roles = ['admin', 'manager', 'staff_gudang', 'checker_opname']
        if role not in valid_roles:
            return ResponseHelper.error(f'Invalid role. Must be one of: {", ".join(valid_roles)}', status_code=400)
        
        # Validate password strength
        if len(password) < 6:
            return ResponseHelper.error('Password must be at least 6 characters', status_code=400)
        
        # Check if username already exists
        if User.query.filter_by(username=username).first():
            return ResponseHelper.error('Username already exists', status_code=400)
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return ResponseHelper.error('Email already exists', status_code=400)
        
        # Create user
        password_hash = AuthService.hash_password(password)
        
        from flask_app.models import RoleEnum
        role_enum = RoleEnum[role.upper().replace('_', '')] if role in ['admin', 'manager'] else (
            RoleEnum.STAFF_GUDANG if role == 'staff_gudang' else RoleEnum.CHECKER_OPNAME
        )
        
        new_user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            nama_lengkap=name,
            role=role_enum,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        logger.info(f'User {username} created by admin {current_user.username}')
        
        return ResponseHelper.success({
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email,
            'name': new_user.nama_lengkap,
            'role': str(new_user.role.value)
        }, 'User created successfully', 201)
    
    except Exception as e:
        db.session.rollback()
        logger.error(f'Create user error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)


# ============================================
# PUT /users/<id> - Update user
# ============================================

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user information"""
    try:
        # Check if current user is admin
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user or str(current_user.role.value) != 'admin':
            return ResponseHelper.error('Unauthorized. Admin role required', status_code=403)
        
        user = User.query.get(user_id)
        if not user:
            return ResponseHelper.error('User not found', status_code=404)
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            user.nama_lengkap = data['name'].strip()
        
        if 'email' in data:
            new_email = data['email'].strip()
            # Check if email already used by another user
            existing = User.query.filter(User.email == new_email, User.id != user_id).first()
            if existing:
                return ResponseHelper.error('Email already used by another user', status_code=400)
            user.email = new_email
        
        if 'role' in data:
            valid_roles = ['admin', 'manager', 'staff_gudang', 'checker_opname']
            if data['role'] not in valid_roles:
                return ResponseHelper.error(f'Invalid role', status_code=400)
            
            from flask_app.models import RoleEnum
            role_enum = RoleEnum[data['role'].upper().replace('_', '')] if data['role'] in ['admin', 'manager'] else (
                RoleEnum.STAFF_GUDANG if data['role'] == 'staff_gudang' else RoleEnum.CHECKER_OPNAME
            )
            user.role = role_enum
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f'User {user.username} updated by admin {current_user.username}')
        
        return ResponseHelper.success({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'name': user.nama_lengkap,
            'role': str(user.role.value)
        }, 'User updated successfully')
    
    except Exception as e:
        db.session.rollback()
        logger.error(f'Update user error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)


# ============================================
# DELETE /users/<id> - Soft delete user
# ============================================

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Soft delete user (set is_active to False)"""
    try:
        # Check if current user is admin
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user or str(current_user.role.value) != 'admin':
            return ResponseHelper.error('Unauthorized. Admin role required', status_code=403)
        
        # Prevent self-deletion
        if current_user_id == user_id:
            return ResponseHelper.error('Cannot delete your own account', status_code=400)
        
        user = User.query.get(user_id)
        if not user:
            return ResponseHelper.error('User not found', status_code=404)
        
        # Soft delete - set is_active to False
        user.is_active = False
        user.updated_at = datetime.utcnow()
        
        # Also set deleted_at timestamp
        from datetime import datetime
        user.deleted_at = datetime.utcnow() if hasattr(user, 'deleted_at') else None
        
        db.session.commit()
        
        logger.info(f'User {user.username} soft-deleted by admin {current_user.username}')
        
        return ResponseHelper.success(None, 'User deleted successfully')
    
    except Exception as e:
        db.session.rollback()
        logger.error(f'Delete user error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)


# ============================================
# POST /users/<id>/reset-password - Reset user password
# ============================================

@users_bp.route('/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_user_password(user_id):
    """Reset user password (admin only)"""
    try:
        # Check if current user is admin
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user or str(current_user.role.value) != 'admin':
            return ResponseHelper.error('Unauthorized. Admin role required', status_code=403)
        
        user = User.query.get(user_id)
        if not user:
            return ResponseHelper.error('User not found', status_code=404)
        
        # Generate new random password
        import secrets
        import string
        
        alphabet = string.ascii_letters + string.digits
        new_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        
        # Update password
        user.password_hash = AuthService.hash_password(new_password)
        user.updated_at = datetime.utcnow()
        
        # Invalidate all sessions
        from flask_app.models import UserSession
        UserSession.query.filter_by(user_id=user_id, is_active=True).update({
            'is_active': False,
            'logout_at': datetime.utcnow()
        })
        
        db.session.commit()
        
        logger.info(f'Password reset for user {user.username} by admin {current_user.username}')
        
        return ResponseHelper.success({
            'temp_password': new_password
        }, 'Password reset successfully. Please provide the temporary password to the user.')
    
    except Exception as e:
        db.session.rollback()
        logger.error(f'Reset password error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)


# ============================================
# POST /users/<id>/enable - Enable user
# ============================================

@users_bp.route('/<int:user_id>/enable', methods=['POST'])
@jwt_required()
def enable_user(user_id):
    """Enable a disabled user"""
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user or str(current_user.role.value) != 'admin':
            return ResponseHelper.error('Unauthorized. Admin role required', status_code=403)
        
        user = User.query.get(user_id)
        if not user:
            return ResponseHelper.error('User not found', status_code=404)
        
        user.is_active = True
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f'User {user.username} enabled by admin {current_user.username}')
        
        return ResponseHelper.success(None, 'User enabled successfully')
    
    except Exception as e:
        db.session.rollback()
        logger.error(f'Enable user error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)


# ============================================
# POST /users/<id>/disable - Disable user
# ============================================

@users_bp.route('/<int:user_id>/disable', methods=['POST'])
@jwt_required()
def disable_user(user_id):
    """Disable a user (soft delete)"""
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user or str(current_user.role.value) != 'admin':
            return ResponseHelper.error('Unauthorized. Admin role required', status_code=403)
        
        # Prevent self-disable
        if current_user_id == user_id:
            return ResponseHelper.error('Cannot disable your own account', status_code=400)
        
        user = User.query.get(user_id)
        if not user:
            return ResponseHelper.error('User not found', status_code=404)
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        
        # Invalidate all sessions
        from flask_app.models import UserSession
        UserSession.query.filter_by(user_id=user_id, is_active=True).update({
            'is_active': False,
            'logout_at': datetime.utcnow()
        })
        
        db.session.commit()
        
        logger.info(f'User {user.username} disabled by admin {current_user.username}')
        
        return ResponseHelper.success(None, 'User disabled successfully')
    
    except Exception as e:
        db.session.rollback()
        logger.error(f'Disable user error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)


# ============================================
# GET /users/stats - Get user statistics
# ============================================

@users_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user statistics"""
    try:
        from flask_app.models import RoleEnum
        
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        inactive_users = total_users - active_users
        
        admin_count = User.query.filter(
            User.role == RoleEnum.ADMIN,
            User.is_active == True
        ).count()
        
        staff_count = User.query.filter(
            User.role == RoleEnum.STAFF_GUDANG,
            User.is_active == True
        ).count()
        
        checker_count = User.query.filter(
            User.role == RoleEnum.CHECKER_OPNAME,
            User.is_active == True
        ).count()
        
        return ResponseHelper.success({
            'total': total_users,
            'active': active_users,
            'inactive': inactive_users,
            'by_role': {
                'admin': admin_count,
                'staff': staff_count,
                'checker': checker_count
            }
        })
    
    except Exception as e:
        logger.error(f'Get user stats error: {str(e)}')
        return ResponseHelper.error(str(e), status_code=500)