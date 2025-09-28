from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.models.base import get_db
from app.models.staff import Staff
from app.config.settings import get_settings
from app.middleware.security import verify_local_network, verify_wifi_mac_address
from datetime import timedelta, datetime
from passlib.context import CryptContext
from jose import JWTError, jwt
import ipaddress

router = APIRouter()
security = HTTPBearer()
settings = get_settings()

# Password hashing
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
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

class LoginRequest(BaseModel):
    employee_code: str
    password: str
    mac_address: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    staff_id: int
    name: str
    employee_code: str
    is_admin: bool

class TokenData(BaseModel):
    staff_id: Optional[int] = None
    employee_code: Optional[str] = None

def get_current_staff(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Staff:
    """Get current authenticated staff member"""
    token = credentials.credentials
    payload = verify_token(token)
    
    staff_id = payload.get("sub")
    if staff_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff not found"
        )
    
    return staff

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Staff login with network verification"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify MAC address if provided
    if login_data.mac_address and not verify_wifi_mac_address(login_data.mac_address):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Invalid device"
        )
    
    # Find staff member
    staff = db.query(Staff).filter(
        Staff.employee_code == login_data.employee_code,
        Staff.is_active == True
    ).first()
    
    if not staff or not verify_password(login_data.password, staff.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect employee code or password"
        )
    
    # Create access token
    access_token_expires = timedelta(hours=8)
    access_token = create_access_token(
        data={"sub": str(staff.id), "employee_code": staff.employee_code},
        expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        staff_id=staff.id,
        name=staff.name,
        employee_code=staff.employee_code,
        is_admin=staff.is_admin
    )

@router.post("/logout")
async def logout():
    """Staff logout"""
    return {"message": "Successfully logged out"}

@router.post("/refresh-token")
async def refresh_token(
    current_staff: Staff = Depends(get_current_staff)
):
    """Refresh access token"""
    access_token_expires = timedelta(hours=8)
    access_token = create_access_token(
        data={"sub": str(current_staff.id), "employee_code": current_staff.employee_code},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/verify-network")
async def verify_network(request: Request):
    """Check if request is from local network"""
    is_local = verify_local_network(request)
    client_ip = request.client.host
    
    return {
        "is_local_network": is_local,
        "client_ip": client_ip,
        "message": "Local network access verified" if is_local else "Not on local network"
    }