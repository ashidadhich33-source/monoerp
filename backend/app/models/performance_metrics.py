"""
Performance metrics model for monitoring system performance
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Index
from sqlalchemy.sql import func
from app.models.base import Base

class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    metric_type = Column(String(50), nullable=False, index=True)  # response_time, cpu_usage, memory_usage, etc.
    value = Column(Float, nullable=False)
    details = Column(JSON, nullable=True)  # Additional metric details
    timestamp = Column(DateTime, default=func.now(), nullable=False, index=True)
    
    # Create composite indexes for common queries
    __table_args__ = (
        Index('idx_metric_timestamp', 'metric_type', 'timestamp'),
        Index('idx_timestamp_metric', 'timestamp', 'metric_type'),
    )