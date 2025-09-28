from sqlalchemy import Column, Integer, String, Float, Date, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from .base import Base

class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    basic_salary = Column(Float, nullable=False, default=0.0)
    incentive_percentage = Column(Float, nullable=False, default=0.0)
    department = Column(String(100), nullable=True)
    joining_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    
    # Relationships
    attendance_records = relationship("Attendance", back_populates="staff")
    sales_records = relationship("Sales", back_populates="staff")
    targets = relationship("Targets", back_populates="staff")
    achievements = relationship("Achievements", back_populates="staff")
    salary_records = relationship("Salary", back_populates="staff")
    advances = relationship("Advances", back_populates="staff")
    rankings = relationship("Rankings", back_populates="staff")
    notifications = relationship("Notification", back_populates="staff")