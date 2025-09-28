from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base
import enum

class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half-day"
    HOLIDAY = "holiday"

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    date = Column(Date, nullable=False)
    wifi_mac_address = Column(String(17), nullable=True)  # MAC address format: AA:BB:CC:DD:EE:FF
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    device_fingerprint = Column(String(255), nullable=True)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.ABSENT)
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    staff = relationship("Staff", back_populates="attendance_records")