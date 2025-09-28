"""
Comprehensive error handling and logging utilities
"""
import logging
import traceback
from typing import Dict, Any, Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class AppException(Exception):
    """Base application exception"""
    def __init__(self, message: str, error_code: str = None, details: Dict[str, Any] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationException(AppException):
    """Validation error exception"""
    pass

class AuthenticationException(AppException):
    """Authentication error exception"""
    pass

class AuthorizationException(AppException):
    """Authorization error exception"""
    pass

class DatabaseException(AppException):
    """Database error exception"""
    pass

class BusinessLogicException(AppException):
    """Business logic error exception"""
    pass

class ExternalServiceException(AppException):
    """External service error exception"""
    pass

def log_error(error: Exception, request: Request = None, user_id: str = None):
    """Log error with context information"""
    error_context = {
        "timestamp": datetime.now().isoformat(),
        "error_type": type(error).__name__,
        "error_message": str(error),
        "user_id": user_id,
        "request_url": str(request.url) if request else None,
        "request_method": request.method if request else None,
        "client_ip": request.client.host if request else None,
        "traceback": traceback.format_exc()
    }
    
    logger.error(f"Application Error: {json.dumps(error_context, indent=2)}")

def handle_validation_error(error: ValidationError) -> JSONResponse:
    """Handle Pydantic validation errors"""
    error_details = []
    for err in error.errors():
        error_details.append({
            "field": ".".join(str(x) for x in err["loc"]),
            "message": err["msg"],
            "type": err["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Invalid input data",
            "details": error_details
        }
    )

def handle_database_error(error: SQLAlchemyError) -> JSONResponse:
    """Handle database errors"""
    log_error(error)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Database Error",
            "message": "A database error occurred. Please try again later.",
            "details": {"type": "database_error"}
        }
    )

def handle_authentication_error(error: AuthenticationException) -> JSONResponse:
    """Handle authentication errors"""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": "Authentication Error",
            "message": error.message,
            "details": error.details
        }
    )

def handle_authorization_error(error: AuthorizationException) -> JSONResponse:
    """Handle authorization errors"""
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={
            "error": "Authorization Error",
            "message": error.message,
            "details": error.details
        }
    )

def handle_business_logic_error(error: BusinessLogicException) -> JSONResponse:
    """Handle business logic errors"""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Business Logic Error",
            "message": error.message,
            "details": error.details
        }
    )

def handle_external_service_error(error: ExternalServiceException) -> JSONResponse:
    """Handle external service errors"""
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "External Service Error",
            "message": error.message,
            "details": error.details
        }
    )

def handle_generic_error(error: Exception, request: Request = None) -> JSONResponse:
    """Handle generic errors"""
    log_error(error, request)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "details": {"type": "internal_error"}
        }
    )

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler"""
    if isinstance(exc, ValidationError):
        return handle_validation_error(exc)
    elif isinstance(exc, SQLAlchemyError):
        return handle_database_error(exc)
    elif isinstance(exc, AuthenticationException):
        return handle_authentication_error(exc)
    elif isinstance(exc, AuthorizationException):
        return handle_authorization_error(exc)
    elif isinstance(exc, BusinessLogicException):
        return handle_business_logic_error(exc)
    elif isinstance(exc, ExternalServiceException):
        return handle_external_service_error(exc)
    elif isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": "HTTP Error", "message": exc.detail}
        )
    else:
        return handle_generic_error(exc, request)

def create_error_response(
    message: str,
    error_code: str = None,
    status_code: int = 400,
    details: Dict[str, Any] = None
) -> JSONResponse:
    """Create standardized error response"""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": "Application Error",
            "message": message,
            "error_code": error_code,
            "details": details or {}
        }
    )

def validate_required_fields(data: Dict[str, Any], required_fields: list) -> Optional[str]:
    """Validate required fields in request data"""
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    if missing_fields:
        return f"Missing required fields: {', '.join(missing_fields)}"
    return None

def sanitize_input(data: str) -> str:
    """Sanitize user input to prevent XSS and injection attacks"""
    if not isinstance(data, str):
        return data
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '`', '$']
    for char in dangerous_chars:
        data = data.replace(char, '')
    
    # Trim whitespace
    data = data.strip()
    
    return data

def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    import re
    pattern = r'^\+?[\d\s\-\(\)]{10,}$'
    return re.match(pattern, phone) is not None

def validate_employee_code(code: str) -> bool:
    """Validate employee code format"""
    import re
    pattern = r'^[A-Z]{3}\d{3}$'
    return re.match(pattern, code) is not None

def log_user_action(user_id: str, action: str, details: Dict[str, Any] = None):
    """Log user actions for audit trail"""
    audit_log = {
        "timestamp": datetime.now().isoformat(),
        "user_id": user_id,
        "action": action,
        "details": details or {}
    }
    
    logger.info(f"User Action: {json.dumps(audit_log, indent=2)}")

def log_system_event(event: str, details: Dict[str, Any] = None):
    """Log system events"""
    system_log = {
        "timestamp": datetime.now().isoformat(),
        "event": event,
        "details": details or {}
    }
    
    logger.info(f"System Event: {json.dumps(system_log, indent=2)}")

def log_security_event(event: str, details: Dict[str, Any] = None):
    """Log security events"""
    security_log = {
        "timestamp": datetime.now().isoformat(),
        "event": event,
        "details": details or {}
    }
    
    logger.warning(f"Security Event: {json.dumps(security_log, indent=2)}")

def log_performance_metric(metric: str, value: float, details: Dict[str, Any] = None):
    """Log performance metrics"""
    performance_log = {
        "timestamp": datetime.now().isoformat(),
        "metric": metric,
        "value": value,
        "details": details or {}
    }
    
    logger.info(f"Performance Metric: {json.dumps(performance_log, indent=2)}")