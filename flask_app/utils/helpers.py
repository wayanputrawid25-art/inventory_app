# Helper functions dan utilities
from datetime import datetime
from flask import jsonify
import json
from functools import wraps

class ResponseHelper:
    """Helper untuk standardize response"""
    
    @staticmethod
    def success(data=None, message="Success", status_code=200):
        """Success response"""
        return jsonify({
            'success': True,
            'message': message,
            'data': data,
            'timestamp': datetime.utcnow().isoformat()
        }), status_code
    
    @staticmethod
    def error(message="Error", error_code=None, status_code=400):
        """Error response"""
        return jsonify({
            'success': False,
            'message': message,
            'error_code': error_code,
            'timestamp': datetime.utcnow().isoformat()
        }), status_code
    
    @staticmethod
    def paginated(items, total, page, per_page, message="Success"):
        """Paginated response"""
        return jsonify({
            'success': True,
            'message': message,
            'data': items,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': (total + per_page - 1) // per_page
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200

class QueryHelper:
    """Helper untuk query operations"""
    
    @staticmethod
    def get_pagination_params(request):
        """Get pagination parameters dari request"""
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 20
        
        return page, per_page
    
    @staticmethod
    def apply_filters(query, model, filters):
        """Apply multiple filters ke query"""
        for field, value in filters.items():
            if hasattr(model, field) and value is not None:
                query = query.filter(getattr(model, field) == value)
        return query

class DateHelper:
    """Helper untuk date operations"""
    
    @staticmethod
    def get_date_range(period: str):
        """Get date range berdasarkan period (hari, minggu, bulan, tahun)"""
        from datetime import date, timedelta
        today = date.today()
        
        if period == 'today':
            return today, today
        elif period == 'week':
            start = today - timedelta(days=today.weekday())
            return start, today
        elif period == 'month':
            start = date(today.year, today.month, 1)
            return start, today
        elif period == 'year':
            start = date(today.year, 1, 1)
            return start, today
        else:
            return today, today

def validate_json(required_fields):
    """Decorator untuk validate request JSON"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request
            
            if not request.is_json:
                return ResponseHelper.error('Request must be JSON', status_code=400)
            
            data = request.get_json()
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return ResponseHelper.error(
                    f'Missing required fields: {", ".join(missing_fields)}',
                    status_code=400
                )
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
