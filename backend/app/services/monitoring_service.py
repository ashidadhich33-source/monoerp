"""
Monitoring service for system health and performance tracking
"""
import psutil
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.models.staff import Staff
from app.models.attendance import Attendance
from app.models.sales import Sales
from app.models.notifications import Notification
from app.services.notification_service import notification_service
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

class MonitoringService:
    def __init__(self):
        self.settings = get_settings()
        self.metrics_history = []
        self.alerts = []
        self.monitoring_active = False
    
    def start_monitoring(self):
        """Start system monitoring"""
        self.monitoring_active = True
        logger.info("System monitoring started")
    
    def stop_monitoring(self):
        """Stop system monitoring"""
        self.monitoring_active = False
        logger.info("System monitoring stopped")
    
    def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system performance metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available = memory.available
            memory_total = memory.total
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_free = disk.free
            disk_total = disk.total
            
            # Network metrics
            network = psutil.net_io_counters()
            network_bytes_sent = network.bytes_sent
            network_bytes_recv = network.bytes_recv
            
            # Process metrics
            process = psutil.Process()
            process_memory = process.memory_info().rss
            process_cpu = process.cpu_percent()
            
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'cpu': {
                    'percent': cpu_percent,
                    'count': cpu_count
                },
                'memory': {
                    'percent': memory_percent,
                    'available': memory_available,
                    'total': memory_total,
                    'used': memory_total - memory_available
                },
                'disk': {
                    'percent': disk_percent,
                    'free': disk_free,
                    'total': disk_total,
                    'used': disk_total - disk_free
                },
                'network': {
                    'bytes_sent': network_bytes_sent,
                    'bytes_recv': network_bytes_recv
                },
                'process': {
                    'memory': process_memory,
                    'cpu_percent': process_cpu
                }
            }
            
            # Store metrics history
            self.metrics_history.append(metrics)
            
            # Keep only last 1000 entries
            if len(self.metrics_history) > 1000:
                self.metrics_history = self.metrics_history[-1000:]
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
            return {}
    
    def collect_application_metrics(self) -> Dict[str, Any]:
        """Collect application-specific metrics"""
        try:
            db = next(get_db())
            
            # User metrics
            total_users = db.query(Staff).count()
            active_users = db.query(Staff).filter(Staff.is_active == True).count()
            admin_users = db.query(Staff).filter(Staff.is_admin == True).count()
            
            # Attendance metrics
            today = datetime.now().date()
            today_attendance = db.query(Attendance).filter(Attendance.date == today).count()
            this_week_attendance = db.query(Attendance).filter(
                Attendance.date >= today - timedelta(days=7)
            ).count()
            
            # Sales metrics
            today_sales = db.query(Sales).filter(Sales.sale_date == today).count()
            today_sales_amount = db.query(Sales).filter(Sales.sale_date == today).with_entities(
                db.func.sum(Sales.sale_amount)
            ).scalar() or 0
            
            this_week_sales = db.query(Sales).filter(
                Sales.sale_date >= today - timedelta(days=7)
            ).count()
            this_week_sales_amount = db.query(Sales).filter(
                Sales.sale_date >= today - timedelta(days=7)
            ).with_entities(db.func.sum(Sales.sale_amount)).scalar() or 0
            
            # Notification metrics
            unread_notifications = db.query(Notification).filter(Notification.is_read == False).count()
            today_notifications = db.query(Notification).filter(
                Notification.created_at >= today
            ).count()
            
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'admins': admin_users
                },
                'attendance': {
                    'today': today_attendance,
                    'this_week': this_week_attendance
                },
                'sales': {
                    'today_count': today_sales,
                    'today_amount': today_sales_amount,
                    'this_week_count': this_week_sales,
                    'this_week_amount': this_week_sales_amount
                },
                'notifications': {
                    'unread': unread_notifications,
                    'today': today_notifications
                }
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to collect application metrics: {e}")
            return {}
    
    def check_system_health(self) -> Dict[str, Any]:
        """Check overall system health"""
        try:
            system_metrics = self.collect_system_metrics()
            app_metrics = self.collect_application_metrics()
            
            health_status = {
                'timestamp': datetime.now().isoformat(),
                'overall_status': 'healthy',
                'checks': {
                    'cpu': self._check_cpu_health(system_metrics),
                    'memory': self._check_memory_health(system_metrics),
                    'disk': self._check_disk_health(system_metrics),
                    'database': self._check_database_health(),
                    'application': self._check_application_health(app_metrics)
                }
            }
            
            # Determine overall status
            if any(check['status'] == 'critical' for check in health_status['checks'].values()):
                health_status['overall_status'] = 'critical'
            elif any(check['status'] == 'warning' for check in health_status['checks'].values()):
                health_status['overall_status'] = 'warning'
            
            return health_status
            
        except Exception as e:
            logger.error(f"Failed to check system health: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'overall_status': 'error',
                'error': str(e)
            }
    
    def _check_cpu_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Check CPU health"""
        cpu_percent = metrics.get('cpu', {}).get('percent', 0)
        
        if cpu_percent > 90:
            return {'status': 'critical', 'message': f'CPU usage is {cpu_percent}%'}
        elif cpu_percent > 80:
            return {'status': 'warning', 'message': f'CPU usage is {cpu_percent}%'}
        else:
            return {'status': 'healthy', 'message': f'CPU usage is {cpu_percent}%'}
    
    def _check_memory_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Check memory health"""
        memory_percent = metrics.get('memory', {}).get('percent', 0)
        
        if memory_percent > 95:
            return {'status': 'critical', 'message': f'Memory usage is {memory_percent}%'}
        elif memory_percent > 85:
            return {'status': 'warning', 'message': f'Memory usage is {memory_percent}%'}
        else:
            return {'status': 'healthy', 'message': f'Memory usage is {memory_percent}%'}
    
    def _check_disk_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Check disk health"""
        disk_percent = metrics.get('disk', {}).get('percent', 0)
        
        if disk_percent > 95:
            return {'status': 'critical', 'message': f'Disk usage is {disk_percent}%'}
        elif disk_percent > 85:
            return {'status': 'warning', 'message': f'Disk usage is {disk_percent}%'}
        else:
            return {'status': 'healthy', 'message': f'Disk usage is {disk_percent}%'}
    
    def _check_database_health(self) -> Dict[str, Any]:
        """Check database health"""
        try:
            db = next(get_db())
            # Simple query to test database connection
            db.query(Staff).first()
            return {'status': 'healthy', 'message': 'Database connection is working'}
        except Exception as e:
            return {'status': 'critical', 'message': f'Database error: {str(e)}'}
    
    def _check_application_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Check application health"""
        try:
            # Check if we have active users
            active_users = metrics.get('users', {}).get('active', 0)
            if active_users == 0:
                return {'status': 'warning', 'message': 'No active users found'}
            
            # Check if we have recent activity
            today_attendance = metrics.get('attendance', {}).get('today', 0)
            if today_attendance == 0:
                return {'status': 'warning', 'message': 'No attendance recorded today'}
            
            return {'status': 'healthy', 'message': 'Application is functioning normally'}
            
        except Exception as e:
            return {'status': 'critical', 'message': f'Application error: {str(e)}'}
    
    def create_alert(self, alert_type: str, severity: str, message: str, 
                    data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a system alert"""
        try:
            alert = {
                'id': len(self.alerts) + 1,
                'type': alert_type,
                'severity': severity,
                'message': message,
                'data': data or {},
                'timestamp': datetime.now().isoformat(),
                'acknowledged': False
            }
            
            self.alerts.append(alert)
            
            # Send notification to admins
            db = next(get_db())
            admin_users = db.query(Staff).filter(Staff.is_admin == True).all()
            
            for admin in admin_users:
                notification_service.create_notification(
                    db=db,
                    user_id=admin.id,
                    title=f"System Alert: {alert_type}",
                    message=message,
                    notification_type="alert",
                    priority="high" if severity == "critical" else "normal",
                    data=alert
                )
            
            logger.warning(f"System alert created: {alert_type} - {message}")
            return alert
            
        except Exception as e:
            logger.error(f"Failed to create alert: {e}")
            return {}
    
    def get_alerts(self, severity: Optional[str] = None, 
                  acknowledged: Optional[bool] = None) -> List[Dict[str, Any]]:
        """Get system alerts"""
        try:
            filtered_alerts = self.alerts.copy()
            
            if severity:
                filtered_alerts = [a for a in filtered_alerts if a['severity'] == severity]
            
            if acknowledged is not None:
                filtered_alerts = [a for a in filtered_alerts if a['acknowledged'] == acknowledged]
            
            # Sort by timestamp (newest first)
            filtered_alerts.sort(key=lambda x: x['timestamp'], reverse=True)
            return filtered_alerts
            
        except Exception as e:
            logger.error(f"Failed to get alerts: {e}")
            return []
    
    def acknowledge_alert(self, alert_id: int) -> Dict[str, Any]:
        """Acknowledge an alert"""
        try:
            for alert in self.alerts:
                if alert['id'] == alert_id:
                    alert['acknowledged'] = True
                    alert['acknowledged_at'] = datetime.now().isoformat()
                    return {'success': True, 'message': 'Alert acknowledged'}
            
            return {'success': False, 'message': 'Alert not found'}
            
        except Exception as e:
            logger.error(f"Failed to acknowledge alert: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_metrics_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get metrics summary for the last N hours"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            recent_metrics = [
                m for m in self.metrics_history 
                if datetime.fromisoformat(m['timestamp']) >= cutoff_time
            ]
            
            if not recent_metrics:
                return {'message': 'No metrics available for the specified period'}
            
            # Calculate averages
            cpu_avg = sum(m['cpu']['percent'] for m in recent_metrics) / len(recent_metrics)
            memory_avg = sum(m['memory']['percent'] for m in recent_metrics) / len(recent_metrics)
            disk_avg = sum(m['disk']['percent'] for m in recent_metrics) / len(recent_metrics)
            
            # Calculate trends
            cpu_trend = self._calculate_trend([m['cpu']['percent'] for m in recent_metrics])
            memory_trend = self._calculate_trend([m['memory']['percent'] for m in recent_metrics])
            disk_trend = self._calculate_trend([m['disk']['percent'] for m in recent_metrics])
            
            return {
                'period_hours': hours,
                'data_points': len(recent_metrics),
                'averages': {
                    'cpu': round(cpu_avg, 2),
                    'memory': round(memory_avg, 2),
                    'disk': round(disk_avg, 2)
                },
                'trends': {
                    'cpu': cpu_trend,
                    'memory': memory_trend,
                    'disk': disk_trend
                },
                'latest_metrics': recent_metrics[-1] if recent_metrics else None
            }
            
        except Exception as e:
            logger.error(f"Failed to get metrics summary: {e}")
            return {'error': str(e)}
    
    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction"""
        if len(values) < 2:
            return 'stable'
        
        first_half = values[:len(values)//2]
        second_half = values[len(values)//2:]
        
        first_avg = sum(first_half) / len(first_half)
        second_avg = sum(second_half) / len(second_half)
        
        if second_avg > first_avg * 1.05:
            return 'increasing'
        elif second_avg < first_avg * 0.95:
            return 'decreasing'
        else:
            return 'stable'
    
    def get_monitoring_status(self) -> Dict[str, Any]:
        """Get monitoring service status"""
        return {
            'monitoring_active': self.monitoring_active,
            'metrics_collected': len(self.metrics_history),
            'alerts_count': len(self.alerts),
            'unacknowledged_alerts': len([a for a in self.alerts if not a['acknowledged']]),
            'last_metrics_collection': self.metrics_history[-1]['timestamp'] if self.metrics_history else None
        }

# Global monitoring service instance
monitoring_service = MonitoringService()