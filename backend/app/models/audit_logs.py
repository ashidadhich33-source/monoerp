"""
Audit log model for tracking system events and user actions
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Index
from sqlalchemy.sql import func
from app.models.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)  # NULL for system events
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False, index=True)
    resource_id = Column(Integer, nullable=True, index=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False, default='info')  # info, warning, error, critical
    timestamp = Column(DateTime, default=func.now(), nullable=False, index=True)
    
    # Create composite indexes for common queries
    __table_args__ = (
        Index('idx_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_resource_timestamp', 'resource_type', 'timestamp'),
        Index('idx_action_timestamp', 'action', 'timestamp'),
    )