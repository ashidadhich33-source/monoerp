from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from .base import Base

class Brands(Base):
    __tablename__ = "brands"
    
    id = Column(Integer, primary_key=True, index=True)
    brand_name = Column(String(100), nullable=False)
    brand_code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    
    # Relationships
    sales_records = relationship("Sales", back_populates="brand")