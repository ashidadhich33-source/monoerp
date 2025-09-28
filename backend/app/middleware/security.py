"""
Security middleware for network verification and fraud prevention
"""
import ipaddress
import hashlib
import hmac
import time
from typing import Optional, List
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class SecurityMiddleware:
    def __init__(self):
        self.allowed_networks = []
        self.wifi_mac_addresses = []
        self.rate_limit_storage = {}
        self.max_requests_per_minute = 60
        
    def add_allowed_network(self, network: str):
        """Add an allowed network subnet"""
        try:
            # Handle comma-separated networks
            for net in network.split(','):
                net = net.strip()
                if net:
                    self.allowed_networks.append(ipaddress.ip_network(net))
        except ValueError as e:
            logger.error(f"Invalid network format: {network} - {e}")
    
    def add_wifi_mac_address(self, mac_address: str):
        """Add an allowed WiFi MAC address"""
        self.wifi_mac_addresses.append(mac_address.lower())
    
    def is_local_network(self, client_ip: str) -> bool:
        """Check if client IP is in allowed local networks"""
        try:
            # Allow localhost for development
            if client_ip in ["127.0.0.1", "localhost", "::1"]:
                return True
            client_ip_obj = ipaddress.ip_address(client_ip)
            return any(client_ip_obj in network for network in self.allowed_networks)
        except ValueError:
            return False
    
    def verify_wifi_mac(self, mac_address: str) -> bool:
        """Verify if MAC address is in allowed list"""
        if not self.wifi_mac_addresses:
            return True  # If no MAC addresses configured, allow all
        return mac_address.lower() in self.wifi_mac_addresses
    
    def check_rate_limit(self, client_ip: str) -> bool:
        """Check if client has exceeded rate limit"""
        current_time = time.time()
        minute_key = int(current_time // 60)
        
        if client_ip not in self.rate_limit_storage:
            self.rate_limit_storage[client_ip] = {}
        
        client_data = self.rate_limit_storage[client_ip]
        
        # Clean old entries
        for key in list(client_data.keys()):
            if key < minute_key - 1:
                del client_data[key]
        
        # Check current minute
        current_count = client_data.get(minute_key, 0)
        if current_count >= self.max_requests_per_minute:
            return False
        
        # Increment counter
        client_data[minute_key] = current_count + 1
        return True
    
    def generate_device_fingerprint(self, request: Request) -> str:
        """Generate a device fingerprint for fraud detection"""
        user_agent = request.headers.get("user-agent", "")
        accept_language = request.headers.get("accept-language", "")
        accept_encoding = request.headers.get("accept-encoding", "")
        
        fingerprint_data = f"{user_agent}:{accept_language}:{accept_encoding}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()
    
    def verify_time_window(self, check_time: str) -> bool:
        """Verify if check-in/out is within allowed time window"""
        from datetime import datetime, time as dt_time
        
        try:
            check_datetime = datetime.fromisoformat(check_time.replace('Z', '+00:00'))
            current_time = datetime.now(check_datetime.tzinfo)
            
            # Allow 5 minutes tolerance
            time_diff = abs((current_time - check_datetime).total_seconds())
            return time_diff <= 300  # 5 minutes
        except Exception:
            return False
    
    def validate_session_token(self, token: str) -> bool:
        """Validate session token integrity"""
        try:
            # Basic token validation - in production, use proper JWT validation
            if not token or len(token) < 32:
                return False
            return True
        except Exception:
            return False

# Global security middleware instance
security_middleware = SecurityMiddleware()

async def security_middleware_handler(request: Request, call_next):
    """Main security middleware handler"""
    client_ip = request.client.host
    
    # Skip security checks for health check and public endpoints
    if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
        return await call_next(request)
    
    # Rate limiting
    if not security_middleware.check_rate_limit(client_ip):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded. Please try again later."}
        )
    
    # Network verification for staff endpoints
    if request.url.path.startswith("/api/staff"):
        if not security_middleware.is_local_network(client_ip):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Access denied: Not on local network"}
            )
    
    # Add security headers
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response

def verify_local_network(request: Request) -> bool:
    """Verify if request is from local network"""
    client_ip = request.client.host
    return security_middleware.is_local_network(client_ip)

def verify_wifi_mac_address(mac_address: str) -> bool:
    """Verify WiFi MAC address"""
    return security_middleware.verify_wifi_mac(mac_address)

def generate_device_fingerprint(request: Request) -> str:
    """Generate device fingerprint"""
    return security_middleware.generate_device_fingerprint(request)

def verify_time_window(check_time: str) -> bool:
    """Verify time window for check-in/out"""
    return security_middleware.verify_time_window(check_time)