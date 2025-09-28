from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base
import enum

class PeriodType(str, enum.Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class Rankings(Base):
    __tablename__ = "rankings"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    period_type = Column(Enum(PeriodType), nullable=False)
    period_date = Column(Date, nullable=False)
    total_sales = Column(Float, nullable=False)
    rank_position = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    staff = relationship("Staff", back_populates="rankings")