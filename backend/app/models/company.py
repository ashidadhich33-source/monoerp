from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.models.base import Base

class Company(Base):
    """Company model for storing company information"""
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    industry_type = Column(String(100), nullable=True)
    
    # System configuration
    timezone = Column(String(50), default="UTC")
    currency = Column(String(10), default="USD")
    working_hours_start = Column(String(10), default="09:00")
    working_hours_end = Column(String(10), default="17:00")
    
    # Setup tracking
    is_setup_complete = Column(Boolean, default=False)
    setup_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Company(id={self.id}, name='{self.name}')>"
    
    def to_dict(self):
        """Convert company to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "phone": self.phone,
            "industry_type": self.industry_type,
            "timezone": self.timezone,
            "currency": self.currency,
            "working_hours_start": self.working_hours_start,
            "working_hours_end": self.working_hours_end,
            "is_setup_complete": self.is_setup_complete,
            "setup_completed_at": self.setup_completed_at.isoformat() if self.setup_completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }