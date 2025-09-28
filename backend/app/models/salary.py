from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base
import enum

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"

class Salary(Base):
    __tablename__ = "salary"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    month_year = Column(String(7), nullable=False)  # Format: "2024-01"
    basic_salary = Column(Float, nullable=False)
    working_days = Column(Integer, nullable=False)
    present_days = Column(Integer, nullable=False)
    sunday_count = Column(Integer, nullable=False)
    salary_for_days = Column(Float, nullable=False)
    target_incentive = Column(Float, nullable=False, default=0.0)
    basic_incentive = Column(Float, nullable=False, default=0.0)
    gross_salary = Column(Float, nullable=False)
    advance_deduction = Column(Float, nullable=False, default=0.0)
    net_salary = Column(Float, nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # Relationships
    staff = relationship("Staff", back_populates="salary_records")