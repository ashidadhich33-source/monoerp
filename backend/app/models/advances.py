from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from .base import Base
import enum

class DeductionPlan(str, enum.Enum):
    FULL = "full"
    PARTIAL = "partial"

class AdvanceStatus(str, enum.Enum):
    ACTIVE = "active"
    CLEARED = "cleared"

class Advances(Base):
    __tablename__ = "advances"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    advance_amount = Column(Float, nullable=False)
    reason = Column(Text, nullable=True)
    issue_date = Column(Date, nullable=False)
    total_deducted = Column(Float, nullable=False, default=0.0)
    remaining_amount = Column(Float, nullable=False)
    deduction_plan = Column(Enum(DeductionPlan), nullable=False)
    monthly_deduction_amount = Column(Float, nullable=True)
    status = Column(Enum(AdvanceStatus), default=AdvanceStatus.ACTIVE)
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    staff = relationship("Staff", back_populates="advances")