from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import Optional
from app.models.base import get_db
from app.services.setup_service import SetupService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/setup", tags=["Setup"])

# Pydantic models for request/response
class CompanyData(BaseModel):
    name: str
    address: Optional[str] = ""
    phone: Optional[str] = ""
    industry_type: Optional[str] = ""
    timezone: Optional[str] = "UTC"
    currency: Optional[str] = "USD"
    working_hours_start: Optional[str] = "09:00"
    working_hours_end: Optional[str] = "17:00"
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Company name must be at least 2 characters long')
        return v.strip()

class AdminData(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = ""
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()
    
    @validator('email')
    def validate_email(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Email must be at least 2 characters long')
        if '@' not in v or '.' not in v:
            raise ValueError('Email must be valid')
        return v.strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class SetupCompleteData(BaseModel):
    company_data: CompanyData
    admin_data: AdminData
    system_config: Optional[dict] = {}

class SetupStatusResponse(BaseModel):
    is_setup_complete: bool
    message: str
    company: Optional[dict] = None
    admin: Optional[dict] = None

@router.get("/status", response_model=SetupStatusResponse)
async def get_setup_status(db: Session = Depends(get_db)):
    """Check if system setup is complete"""
    try:
        setup_service = SetupService(db)
        result = setup_service.check_setup_status()
        return SetupStatusResponse(**result)
    except Exception as e:
        logger.error(f"Error getting setup status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking setup status: {str(e)}"
        )

@router.post("/company")
async def create_company(
    company_data: CompanyData,
    db: Session = Depends(get_db)
):
    """Create company during setup"""
    try:
        setup_service = SetupService(db)
        result = setup_service.create_company(company_data.dict())
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating company: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating company: {str(e)}"
        )

@router.post("/admin")
async def create_admin(
    admin_data: AdminData,
    db: Session = Depends(get_db)
):
    """Create admin user during setup"""
    try:
        setup_service = SetupService(db)
        result = setup_service.create_admin_user(admin_data.dict())
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating admin user: {str(e)}"
        )

@router.post("/complete")
async def complete_setup(
    setup_data: SetupCompleteData,
    db: Session = Depends(get_db)
):
    """Complete the setup process"""
    try:
        setup_service = SetupService(db)
        
        # Create company
        company_result = setup_service.create_company(setup_data.company_data.dict())
        if not company_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error creating company: {company_result['message']}"
            )
        
        # Create admin user
        admin_result = setup_service.create_admin_user(setup_data.admin_data.dict())
        if not admin_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error creating admin user: {admin_result['message']}"
            )
        
        # Complete setup
        complete_result = setup_service.complete_setup(setup_data.dict())
        if not complete_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error completing setup: {complete_result['message']}"
            )
        
        return {
            "success": True,
            "message": "Setup completed successfully",
            "company": company_result["company"],
            "admin": admin_result["admin"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing setup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error completing setup: {str(e)}"
        )

@router.post("/reset")
async def reset_setup(db: Session = Depends(get_db)):
    """Reset setup state (for testing purposes)"""
    try:
        setup_service = SetupService(db)
        result = setup_service.reset_setup()
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting setup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting setup: {str(e)}"
        )

@router.get("/health")
async def setup_health_check():
    """Health check for setup endpoints"""
    return {"status": "healthy", "message": "Setup endpoints are working"}