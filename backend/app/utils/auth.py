from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Request
from app.config.settings import get_settings
import ipaddress

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm="HS256")
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def is_ip_in_subnet(ip: str, subnet: str) -> bool:
    """Check if IP address is in the allowed subnet"""
    try:
        return ipaddress.ip_address(ip) in ipaddress.ip_network(subnet)
    except ValueError:
        return False

def verify_local_network(request: Request) -> bool:
    """Verify that the request is coming from local network"""
    client_ip = request.client.host
    return is_ip_in_subnet(client_ip, settings.local_network_subnet)

def verify_mac_address(mac_address: str) -> bool:
    """Verify that the MAC address is whitelisted"""
    if not mac_address:
        return False
    return mac_address.upper() in [mac.upper() for mac in settings.wifi_mac_addresses]

def get_device_fingerprint(request: Request) -> str:
    """Generate device fingerprint from request headers"""
    user_agent = request.headers.get("user-agent", "")
    accept_language = request.headers.get("accept-language", "")
    accept_encoding = request.headers.get("accept-encoding", "")
    
    # Simple fingerprint - in production, use more sophisticated methods
    fingerprint = f"{user_agent}:{accept_language}:{accept_encoding}"
    return fingerprint