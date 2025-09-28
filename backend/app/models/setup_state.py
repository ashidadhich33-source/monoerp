from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.models.base import Base

class SetupState(Base):
    """Setup state model for tracking system setup progress"""
    __tablename__ = "setup_states"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Setup steps tracking
    company_created = Column(Boolean, default=False)
    admin_created = Column(Boolean, default=False)
    database_initialized = Column(Boolean, default=False)
    system_configured = Column(Boolean, default=False)
    
    # Setup data
    setup_data = Column(Text, nullable=True)  # JSON string of setup data
    
    # Error tracking
    last_error = Column(Text, nullable=True)
    error_count = Column(Integer, default=0)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<SetupState(id={self.id}, company_created={self.company_created}, admin_created={self.admin_created})>"
    
    def is_setup_complete(self):
        """Check if setup is complete"""
        return all([
            self.company_created,
            self.admin_created,
            self.database_initialized,
            self.system_configured
        ])
    
    def to_dict(self):
        """Convert setup state to dictionary"""
        return {
            "id": self.id,
            "company_created": self.company_created,
            "admin_created": self.admin_created,
            "database_initialized": self.database_initialized,
            "system_configured": self.system_configured,
            "setup_data": self.setup_data,
            "last_error": self.last_error,
            "error_count": self.error_count,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_setup_complete": self.is_setup_complete()
        }