"""
Notification service for system alerts and user notifications
"""
import smtplib
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from app.models.staff import Staff
from app.models.notifications import Notification
from app.config.settings import get_settings
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.settings = get_settings()
        self.smtp_config = {
            'host': self.settings.smtp_host,
            'port': self.settings.smtp_port,
            'username': self.settings.smtp_username,
            'password': self.settings.smtp_password,
            'use_tls': self.settings.smtp_use_tls
        }
    
    def create_notification(
        self, 
        db: Session, 
        user_id: int, 
        title: str, 
        message: str, 
        notification_type: str = 'info',
        priority: str = 'normal',
        data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create a new notification"""
        try:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                data=data or {},
                is_read=False,
                created_at=datetime.now()
            )
            
            db.add(notification)
            db.commit()
            
            return {
                "success": True,
                "notification_id": notification.id,
                "message": "Notification created successfully"
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create notification: {e}")
            return {"success": False, "error": str(e)}
    
    def get_user_notifications(
        self, 
        db: Session, 
        user_id: int, 
        limit: int = 50, 
        offset: int = 0,
        unread_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Get notifications for a user"""
        try:
            query = db.query(Notification).filter(Notification.user_id == user_id)
            
            if unread_only:
                query = query.filter(Notification.is_read == False)
            
            notifications = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
            
            return [
                {
                    "id": notification.id,
                    "title": notification.title,
                    "message": notification.message,
                    "type": notification.notification_type,
                    "priority": notification.priority,
                    "is_read": notification.is_read,
                    "data": notification.data,
                    "created_at": notification.created_at.isoformat(),
                    "read_at": notification.read_at.isoformat() if notification.read_at else None
                }
                for notification in notifications
            ]
            
        except Exception as e:
            logger.error(f"Failed to get user notifications: {e}")
            return []
    
    def mark_notification_read(self, db: Session, notification_id: int, user_id: int) -> Dict[str, Any]:
        """Mark a notification as read"""
        try:
            notification = db.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == user_id
            ).first()
            
            if not notification:
                return {"success": False, "error": "Notification not found"}
            
            notification.is_read = True
            notification.read_at = datetime.now()
            
            db.commit()
            
            return {"success": True, "message": "Notification marked as read"}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to mark notification as read: {e}")
            return {"success": False, "error": str(e)}
    
    def mark_all_notifications_read(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Mark all notifications as read for a user"""
        try:
            db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            ).update({
                "is_read": True,
                "read_at": datetime.now()
            })
            
            db.commit()
            
            return {"success": True, "message": "All notifications marked as read"}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to mark all notifications as read: {e}")
            return {"success": False, "error": str(e)}
    
    def send_email_notification(
        self, 
        to_email: str, 
        subject: str, 
        body: str, 
        is_html: bool = False
    ) -> Dict[str, Any]:
        """Send email notification"""
        try:
            if not self.settings.email_notifications_enabled:
                return {"success": False, "error": "Email notifications are disabled"}
            
            msg = MIMEMultipart('alternative')
            msg['From'] = self.smtp_config['username']
            msg['To'] = to_email
            msg['Subject'] = subject
            
            if is_html:
                msg.attach(MIMEText(body, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port']) as server:
                if self.smtp_config['use_tls']:
                    server.starttls()
                server.login(self.smtp_config['username'], self.smtp_config['password'])
                server.send_message(msg)
            
            return {"success": True, "message": "Email sent successfully"}
            
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            return {"success": False, "error": str(e)}
    
    def send_attendance_reminder(self, db: Session, staff_id: int) -> Dict[str, Any]:
        """Send attendance reminder to staff"""
        try:
            staff = db.query(Staff).filter(Staff.id == staff_id).first()
            if not staff:
                return {"success": False, "error": "Staff not found"}
            
            # Create notification
            self.create_notification(
                db=db,
                user_id=staff_id,
                title="Attendance Reminder",
                message="Please check in/out for today's attendance",
                notification_type="reminder",
                priority="normal"
            )
            
            # Send email if enabled
            if self.settings.email_notifications_enabled and staff.email:
                subject = "Attendance Reminder - Staff Attendance System"
                body = f"""
                Dear {staff.name},
                
                This is a reminder to check in/out for today's attendance.
                
                Please log in to the system and mark your attendance.
                
                Best regards,
                Staff Attendance System
                """
                
                self.send_email_notification(staff.email, subject, body)
            
            return {"success": True, "message": "Attendance reminder sent"}
            
        except Exception as e:
            logger.error(f"Failed to send attendance reminder: {e}")
            return {"success": False, "error": str(e)}
    
    def send_salary_notification(self, db: Session, staff_id: int, salary_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send salary notification to staff"""
        try:
            staff = db.query(Staff).filter(Staff.id == staff_id).first()
            if not staff:
                return {"success": False, "error": "Staff not found"}
            
            # Create notification
            self.create_notification(
                db=db,
                user_id=staff_id,
                title="Salary Details Available",
                message=f"Your salary for {salary_data['month_year']} is now available",
                notification_type="salary",
                priority="high",
                data=salary_data
            )
            
            # Send email if enabled
            if self.settings.email_notifications_enabled and staff.email:
                subject = f"Salary Details - {salary_data['month_year']}"
                body = f"""
                Dear {staff.name},
                
                Your salary details for {salary_data['month_year']} are now available:
                
                Basic Salary: ₹{salary_data['basic_salary']:,.2f}
                Net Salary: ₹{salary_data['net_salary']:,.2f}
                
                Please log in to the system to view detailed salary slip.
                
                Best regards,
                Staff Attendance System
                """
                
                self.send_email_notification(staff.email, subject, body)
            
            return {"success": True, "message": "Salary notification sent"}
            
        except Exception as e:
            logger.error(f"Failed to send salary notification: {e}")
            return {"success": False, "error": str(e)}
    
    def send_target_achievement_notification(
        self, 
        db: Session, 
        staff_id: int, 
        target_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send target achievement notification"""
        try:
            staff = db.query(Staff).filter(Staff.id == staff_id).first()
            if not staff:
                return {"success": False, "error": "Staff not found"}
            
            # Create notification
            self.create_notification(
                db=db,
                user_id=staff_id,
                title="Target Achievement",
                message=f"Congratulations! You have achieved {target_data['achievement_percentage']:.1f}% of your target",
                notification_type="achievement",
                priority="high",
                data=target_data
            )
            
            return {"success": True, "message": "Target achievement notification sent"}
            
        except Exception as e:
            logger.error(f"Failed to send target achievement notification: {e}")
            return {"success": False, "error": str(e)}
    
    def send_system_alert(self, db: Session, message: str, alert_type: str = 'system') -> Dict[str, Any]:
        """Send system alert to all admin users"""
        try:
            admin_users = db.query(Staff).filter(Staff.is_admin == True).all()
            
            for admin in admin_users:
                self.create_notification(
                    db=db,
                    user_id=admin.id,
                    title="System Alert",
                    message=message,
                    notification_type=alert_type,
                    priority="high"
                )
            
            return {"success": True, "message": "System alert sent to all admins"}
            
        except Exception as e:
            logger.error(f"Failed to send system alert: {e}")
            return {"success": False, "error": str(e)}
    
    def get_notification_statistics(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get notification statistics for a user"""
        try:
            total_notifications = db.query(Notification).filter(Notification.user_id == user_id).count()
            unread_notifications = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            ).count()
            
            # Get notifications by type
            type_counts = db.query(
                Notification.notification_type,
                db.func.count(Notification.id)
            ).filter(Notification.user_id == user_id).group_by(
                Notification.notification_type
            ).all()
            
            return {
                "total_notifications": total_notifications,
                "unread_notifications": unread_notifications,
                "read_notifications": total_notifications - unread_notifications,
                "notifications_by_type": dict(type_counts)
            }
            
        except Exception as e:
            logger.error(f"Failed to get notification statistics: {e}")
            return {}
    
    def cleanup_old_notifications(self, db: Session, days: int = 30) -> Dict[str, Any]:
        """Clean up old notifications"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            deleted_count = db.query(Notification).filter(
                Notification.created_at < cutoff_date,
                Notification.is_read == True
            ).delete()
            
            db.commit()
            
            return {
                "success": True,
                "deleted_count": deleted_count,
                "message": f"Cleaned up {deleted_count} old notifications"
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to cleanup old notifications: {e}")
            return {"success": False, "error": str(e)}

# Global notification service instance
notification_service = NotificationService()