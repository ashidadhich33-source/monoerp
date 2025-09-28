from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Achievements(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    target_id = Column(Integer, ForeignKey("targets.id"), nullable=False)
    achieved_amount = Column(Float, nullable=False)
    achievement_percentage = Column(Float, nullable=False)
    incentive_earned = Column(Float, nullable=False)
    period = Column(String(20), nullable=False)  # e.g., "2024-01" for monthly
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    staff = relationship("Staff", back_populates="achievements")
    target = relationship("Targets", back_populates="achievements")