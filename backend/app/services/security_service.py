"""
Advanced security service
"""
import hashlib
import secrets
import ipaddress
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session
from app.models.staff import Staff
from app.models.audit import AuditLog
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

class SecurityService:
    def __init__(self):
        self.settings = get_settings()
        self.failed_attempts = {}
        self.blocked_ips = set()
        self.suspicious_activities = []
    
    def log_security_event(self, db: Session, user_id: Optional[int], event_type: str, 
                          details: Dict[str, Any], ip_address: str, user_agent: str):
        """Log security events"""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                event_type=event_type,
                details=details,
                ip_address=ip_address,
                user_agent=user_agent,
                timestamp=datetime.now()
            )
            db.add(audit_log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log security event: {e}")
    
    def check_brute_force(self, ip_address: str, max_attempts: int = 5, 
                         window_minutes: int = 15) -> bool:
        """Check for brute force attacks"""
        current_time = datetime.now()
        window_start = current_time - timedelta(minutes=window_minutes)
        
        if ip_address not in self.failed_attempts:
            self.failed_attempts[ip_address] = []
        
        # Clean old attempts
        self.failed_attempts[ip_address] = [
            attempt for attempt in self.failed_attempts[ip_address]
            if attempt > window_start
        ]
        
        return len(self.failed_attempts[ip_address]) >= max_attempts
    
    def record_failed_attempt(self, ip_address: str):
        """Record failed login attempt"""
        if ip_address not in self.failed_attempts:
            self.failed_attempts[ip_address] = []
        
        self.failed_attempts[ip_address].append(datetime.now())
    
    def reset_failed_attempts(self, ip_address: str):
        """Reset failed attempts for IP"""
        if ip_address in self.failed_attempts:
            del self.failed_attempts[ip_address]
    
    def block_ip(self, ip_address: str, duration_hours: int = 24):
        """Block IP address"""
        self.blocked_ips.add(ip_address)
        logger.warning(f"IP {ip_address} blocked for {duration_hours} hours")
    
    def is_ip_blocked(self, ip_address: str) -> bool:
        """Check if IP is blocked"""
        return ip_address in self.blocked_ips
    
    def detect_suspicious_activity(self, user_id: int, activity_type: str, 
                                  details: Dict[str, Any]) -> bool:
        """Detect suspicious user activity"""
        suspicious = False
        
        # Check for unusual login times
        if activity_type == "login":
            current_hour = datetime.now().hour
            if current_hour < 6 or current_hour > 22:
                suspicious = True
                self.suspicious_activities.append({
                    'user_id': user_id,
                    'type': 'unusual_login_time',
                    'details': details,
                    'timestamp': datetime.now()
                })
        
        # Check for rapid successive actions
        if activity_type == "data_access":
            recent_activities = [
                activity for activity in self.suspicious_activities
                if activity['user_id'] == user_id and 
                activity['timestamp'] > datetime.now() - timedelta(minutes=5)
            ]
            if len(recent_activities) > 10:
                suspicious = True
        
        return suspicious
    
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure token"""
        return secrets.token_urlsafe(length)
    
    def hash_sensitive_data(self, data: str) -> str:
        """Hash sensitive data"""
        return hashlib.sha256(data.encode()).hexdigest()
    
    def validate_password_strength(self, password: str) -> Tuple[bool, List[str]]:
        """Validate password strength"""
        issues = []
        
        if len(password) < 8:
            issues.append("Password must be at least 8 characters long")
        
        if not any(c.isupper() for c in password):
            issues.append("Password must contain at least one uppercase letter")
        
        if not any(c.islower() for c in password):
            issues.append("Password must contain at least one lowercase letter")
        
        if not any(c.isdigit() for c in password):
            issues.append("Password must contain at least one number")
        
        if not any(c in "!@#$%^&*(),.?\":{}|<>" for c in password):
            issues.append("Password must contain at least one special character")
        
        return len(issues) == 0, issues
    
    def sanitize_input(self, input_data: str) -> str:
        """Sanitize user input"""
        # Remove potentially dangerous characters
        dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '`']
        for char in dangerous_chars:
            input_data = input_data.replace(char, '')
        
        return input_data.strip()
    
    def validate_ip_address(self, ip_address: str) -> bool:
        """Validate IP address format"""
        try:
            ipaddress.ip_address(ip_address)
            return True
        except ValueError:
            return False
    
    def check_network_security(self, ip_address: str) -> bool:
        """Check if IP is from allowed network"""
        try:
            client_ip = ipaddress.ip_address(ip_address)
            
            for subnet_str in self.settings.local_network_subnet.split(','):
                subnet = ipaddress.ip_network(subnet_str.strip())
                if client_ip in subnet:
                    return True
            
            return False
        except Exception as e:
            logger.error(f"Network security check failed: {e}")
            return False
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        # Simple encryption for demonstration
        # In production, use proper encryption libraries
        import base64
        encoded = base64.b64encode(data.encode()).decode()
        return encoded
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        import base64
        try:
            decoded = base64.b64decode(encrypted_data.encode()).decode()
            return decoded
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return ""
    
    def get_security_report(self, db: Session, days: int = 30) -> Dict[str, Any]:
        """Generate security report"""
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            # Get failed login attempts
            failed_logins = db.query(AuditLog).filter(
                AuditLog.event_type == "failed_login",
                AuditLog.timestamp >= start_date
            ).count()
            
            # Get suspicious activities
            suspicious_activities = db.query(AuditLog).filter(
                AuditLog.event_type.like("suspicious_%"),
                AuditLog.timestamp >= start_date
            ).count()
            
            # Get blocked IPs
            blocked_ips = len(self.blocked_ips)
            
            # Get top IPs by activity
            top_ips = db.query(
                AuditLog.ip_address,
                db.func.count(AuditLog.id).label('count')
            ).filter(
                AuditLog.timestamp >= start_date
            ).group_by(AuditLog.ip_address).order_by(
                db.func.count(AuditLog.id).desc()
            ).limit(10).all()
            
            return {
                'period_days': days,
                'failed_logins': failed_logins,
                'suspicious_activities': suspicious_activities,
                'blocked_ips': blocked_ips,
                'top_ips': [{'ip': ip, 'count': count} for ip, count in top_ips],
                'security_score': self._calculate_security_score(failed_logins, suspicious_activities)
            }
            
        except Exception as e:
            logger.error(f"Security report generation failed: {e}")
            return {'error': str(e)}
    
    def _calculate_security_score(self, failed_logins: int, suspicious_activities: int) -> int:
        """Calculate security score (0-100)"""
        base_score = 100
        
        # Deduct points for failed logins
        base_score -= min(failed_logins * 2, 30)
        
        # Deduct points for suspicious activities
        base_score -= min(suspicious_activities * 5, 40)
        
        return max(base_score, 0)
    
    def cleanup_old_data(self, db: Session, days: int = 90):
        """Clean up old security data"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Clean up old audit logs
            old_logs = db.query(AuditLog).filter(
                AuditLog.timestamp < cutoff_date
            ).delete()
            
            # Clean up old failed attempts
            current_time = datetime.now()
            for ip in list(self.failed_attempts.keys()):
                self.failed_attempts[ip] = [
                    attempt for attempt in self.failed_attempts[ip]
                    if attempt > cutoff_date
                ]
                if not self.failed_attempts[ip]:
                    del self.failed_attempts[ip]
            
            # Clean up old suspicious activities
            self.suspicious_activities = [
                activity for activity in self.suspicious_activities
                if activity['timestamp'] > cutoff_date
            ]
            
            db.commit()
            logger.info(f"Cleaned up {old_logs} old security records")
            
        except Exception as e:
            logger.error(f"Security data cleanup failed: {e}")
            db.rollback()

# Global security service instance
security_service = SecurityService()