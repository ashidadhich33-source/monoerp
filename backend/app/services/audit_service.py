"""
Audit logging service for tracking user actions and system events
"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.audit_logs import AuditLog
from app.models.staff import Staff
import json
import logging

logger = logging.getLogger(__name__)

class AuditService:
    def __init__(self):
        pass
    
    def log_user_action(
        self,
        db: Session,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: Optional[int] = None,
        details: Dict[str, Any] = None,
        ip_address: str = None,
        user_agent: str = None
    ) -> Dict[str, Any]:
        """Log user action for audit trail"""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=details or {},
                ip_address=ip_address,
                user_agent=user_agent,
                timestamp=datetime.now()
            )
            
            db.add(audit_log)
            db.commit()
            
            return {"success": True, "audit_id": audit_log.id}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to log user action: {e}")
            return {"success": False, "error": str(e)}
    
    def log_system_event(
        self,
        db: Session,
        event: str,
        event_type: str,
        details: Dict[str, Any] = None,
        severity: str = 'info'
    ) -> Dict[str, Any]:
        """Log system event"""
        try:
            audit_log = AuditLog(
                user_id=None,  # System event
                action=event,
                resource_type=event_type,
                details=details or {},
                severity=severity,
                timestamp=datetime.now()
            )
            
            db.add(audit_log)
            db.commit()
            
            return {"success": True, "audit_id": audit_log.id}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to log system event: {e}")
            return {"success": False, "error": str(e)}
    
    def log_security_event(
        self,
        db: Session,
        event: str,
        details: Dict[str, Any] = None,
        ip_address: str = None,
        user_agent: str = None
    ) -> Dict[str, Any]:
        """Log security-related events"""
        try:
            audit_log = AuditLog(
                user_id=None,
                action=event,
                resource_type='security',
                details=details or {},
                ip_address=ip_address,
                user_agent=user_agent,
                severity='warning',
                timestamp=datetime.now()
            )
            
            db.add(audit_log)
            db.commit()
            
            return {"success": True, "audit_id": audit_log.id}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to log security event: {e}")
            return {"success": False, "error": str(e)}
    
    def log_data_access(
        self,
        db: Session,
        user_id: int,
        resource_type: str,
        resource_id: int,
        access_type: str,
        ip_address: str = None
    ) -> Dict[str, Any]:
        """Log data access events"""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=f"access_{access_type}",
                resource_type=resource_type,
                resource_id=resource_id,
                details={"access_type": access_type},
                ip_address=ip_address,
                timestamp=datetime.now()
            )
            
            db.add(audit_log)
            db.commit()
            
            return {"success": True, "audit_id": audit_log.id}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to log data access: {e}")
            return {"success": False, "error": str(e)}
    
    def log_data_modification(
        self,
        db: Session,
        user_id: int,
        resource_type: str,
        resource_id: int,
        action: str,
        old_values: Dict[str, Any] = None,
        new_values: Dict[str, Any] = None,
        ip_address: str = None
    ) -> Dict[str, Any]:
        """Log data modification events"""
        try:
            details = {
                "old_values": old_values or {},
                "new_values": new_values or {}
            }
            
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=details,
                ip_address=ip_address,
                timestamp=datetime.now()
            )
            
            db.add(audit_log)
            db.commit()
            
            return {"success": True, "audit_id": audit_log.id}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to log data modification: {e}")
            return {"success": False, "error": str(e)}
    
    def get_audit_logs(
        self,
        db: Session,
        user_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        action: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get audit logs with filters"""
        try:
            query = db.query(AuditLog)
            
            if user_id:
                query = query.filter(AuditLog.user_id == user_id)
            
            if resource_type:
                query = query.filter(AuditLog.resource_type == resource_type)
            
            if action:
                query = query.filter(AuditLog.action == action)
            
            if start_date:
                query = query.filter(AuditLog.timestamp >= start_date)
            
            if end_date:
                query = query.filter(AuditLog.timestamp <= end_date)
            
            audit_logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
            
            result = []
            for log in audit_logs:
                # Get user name if user_id exists
                user_name = None
                if log.user_id:
                    user = db.query(Staff).filter(Staff.id == log.user_id).first()
                    user_name = user.name if user else "Unknown User"
                
                result.append({
                    "id": log.id,
                    "user_id": log.user_id,
                    "user_name": user_name,
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "details": log.details,
                    "ip_address": log.ip_address,
                    "user_agent": log.user_agent,
                    "severity": log.severity,
                    "timestamp": log.timestamp.isoformat()
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get audit logs: {e}")
            return []
    
    def get_user_activity_summary(
        self,
        db: Session,
        user_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get user activity summary"""
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            # Get total actions
            total_actions = db.query(AuditLog).filter(
                AuditLog.user_id == user_id,
                AuditLog.timestamp >= start_date
            ).count()
            
            # Get actions by type
            actions_by_type = db.query(
                AuditLog.action,
                db.func.count(AuditLog.id)
            ).filter(
                AuditLog.user_id == user_id,
                AuditLog.timestamp >= start_date
            ).group_by(AuditLog.action).all()
            
            # Get resource access
            resource_access = db.query(
                AuditLog.resource_type,
                db.func.count(AuditLog.id)
            ).filter(
                AuditLog.user_id == user_id,
                AuditLog.timestamp >= start_date
            ).group_by(AuditLog.resource_type).all()
            
            return {
                "total_actions": total_actions,
                "actions_by_type": dict(actions_by_type),
                "resource_access": dict(resource_access),
                "period_days": days
            }
            
        except Exception as e:
            logger.error(f"Failed to get user activity summary: {e}")
            return {}
    
    def get_security_events(
        self,
        db: Session,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """Get security events for the specified period"""
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            security_logs = db.query(AuditLog).filter(
                AuditLog.resource_type == 'security',
                AuditLog.timestamp >= start_date
            ).order_by(AuditLog.timestamp.desc()).all()
            
            return [
                {
                    "id": log.id,
                    "action": log.action,
                    "details": log.details,
                    "ip_address": log.ip_address,
                    "user_agent": log.user_agent,
                    "timestamp": log.timestamp.isoformat()
                }
                for log in security_logs
            ]
            
        except Exception as e:
            logger.error(f"Failed to get security events: {e}")
            return []
    
    def cleanup_old_logs(self, db: Session, days: int = 90) -> Dict[str, Any]:
        """Clean up old audit logs"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            deleted_count = db.query(AuditLog).filter(
                AuditLog.timestamp < cutoff_date,
                AuditLog.severity != 'critical'
            ).delete()
            
            db.commit()
            
            return {
                "success": True,
                "deleted_count": deleted_count,
                "message": f"Cleaned up {deleted_count} old audit logs"
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to cleanup old audit logs: {e}")
            return {"success": False, "error": str(e)}
    
    def export_audit_logs(
        self,
        db: Session,
        start_date: datetime,
        end_date: datetime,
        format: str = 'json'
    ) -> Dict[str, Any]:
        """Export audit logs for compliance"""
        try:
            logs = db.query(AuditLog).filter(
                AuditLog.timestamp >= start_date,
                AuditLog.timestamp <= end_date
            ).order_by(AuditLog.timestamp).all()
            
            if format == 'json':
                export_data = [
                    {
                        "id": log.id,
                        "user_id": log.user_id,
                        "action": log.action,
                        "resource_type": log.resource_type,
                        "resource_id": log.resource_id,
                        "details": log.details,
                        "ip_address": log.ip_address,
                        "user_agent": log.user_agent,
                        "severity": log.severity,
                        "timestamp": log.timestamp.isoformat()
                    }
                    for log in logs
                ]
                
                return {
                    "success": True,
                    "data": export_data,
                    "count": len(export_data)
                }
            
            return {"success": False, "error": "Unsupported export format"}
            
        except Exception as e:
            logger.error(f"Failed to export audit logs: {e}")
            return {"success": False, "error": str(e)}

# Global audit service instance
audit_service = AuditService()