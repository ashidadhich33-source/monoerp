from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from .base import Base
import enum

class TargetType(str, enum.Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class Targets(Base):
    __tablename__ = "targets"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    target_type = Column(Enum(TargetType), nullable=False)
    total_target_amount = Column(Float, nullable=False)
    brand_wise_targets = Column(JSON, nullable=True)  # JSON field for brand-specific targets
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    incentive_percentage = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    staff = relationship("Staff", back_populates="targets")
    achievements = relationship("Achievements", back_populates="target")