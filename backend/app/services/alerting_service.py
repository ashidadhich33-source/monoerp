"""
Alerting service for comprehensive monitoring and alerting
"""
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.models.staff import Staff
from app.models.notifications import Notification
from app.services.notification_service import notification_service
from app.services.integration_service import integration_service
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

class AlertingService:
    def __init__(self):
        self.settings = get_settings()
        self.alert_rules = {}
        self.alert_history = []
        self.alerting_active = False
        self.alert_thresholds = {
            'cpu_usage': 80,
            'memory_usage': 85,
            'disk_usage': 90,
            'response_time': 5.0,
            'error_rate': 5.0,
            'concurrent_users': 100
        }
    
    def start_alerting(self):
        """Start the alerting service"""
        self.alerting_active = True
        logger.info("Alerting service started")
    
    def stop_alerting(self):
        """Stop the alerting service"""
        self.alerting_active = False
        logger.info("Alerting service stopped")
    
    def create_alert_rule(self, rule_name: str, rule_config: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new alert rule"""
        try:
            rule = {
                'name': rule_name,
                'config': rule_config,
                'enabled': True,
                'created_at': datetime.now().isoformat(),
                'last_triggered': None,
                'trigger_count': 0
            }
            
            self.alert_rules[rule_name] = rule
            
            logger.info(f"Alert rule '{rule_name}' created successfully")
            return {
                'success': True,
                'rule_name': rule_name,
                'message': f"Alert rule '{rule_name}' created successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to create alert rule: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def evaluate_alert_rules(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Evaluate all alert rules against current metrics"""
        try:
            triggered_alerts = []
            
            for rule_name, rule in self.alert_rules.items():
                if not rule['enabled']:
                    continue
                
                alert_triggered = self._evaluate_rule(rule, metrics)
                if alert_triggered:
                    alert = self._create_alert(rule_name, rule, metrics)
                    triggered_alerts.append(alert)
                    
                    # Update rule statistics
                    rule['last_triggered'] = datetime.now().isoformat()
                    rule['trigger_count'] += 1
            
            return triggered_alerts
            
        except Exception as e:
            logger.error(f"Failed to evaluate alert rules: {e}")
            return []
    
    def _evaluate_rule(self, rule: Dict[str, Any], metrics: Dict[str, Any]) -> bool:
        """Evaluate a single alert rule"""
        try:
            config = rule['config']
            rule_type = config.get('type')
            
            if rule_type == 'threshold':
                return self._evaluate_threshold_rule(config, metrics)
            elif rule_type == 'anomaly':
                return self._evaluate_anomaly_rule(config, metrics)
            elif rule_type == 'pattern':
                return self._evaluate_pattern_rule(config, metrics)
            else:
                logger.warning(f"Unknown rule type: {rule_type}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to evaluate rule: {e}")
            return False
    
    def _evaluate_threshold_rule(self, config: Dict[str, Any], metrics: Dict[str, Any]) -> bool:
        """Evaluate threshold-based alert rule"""
        try:
            metric_name = config.get('metric')
            threshold = config.get('threshold')
            operator = config.get('operator', '>')
            
            if metric_name not in metrics:
                return False
            
            current_value = metrics[metric_name]
            
            if operator == '>':
                return current_value > threshold
            elif operator == '<':
                return current_value < threshold
            elif operator == '>=':
                return current_value >= threshold
            elif operator == '<=':
                return current_value <= threshold
            elif operator == '==':
                return current_value == threshold
            else:
                logger.warning(f"Unknown operator: {operator}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to evaluate threshold rule: {e}")
            return False
    
    def _evaluate_anomaly_rule(self, config: Dict[str, Any], metrics: Dict[str, Any]) -> bool:
        """Evaluate anomaly-based alert rule"""
        try:
            metric_name = config.get('metric')
            sensitivity = config.get('sensitivity', 0.1)
            
            if metric_name not in metrics:
                return False
            
            current_value = metrics[metric_name]
            
            # Simple anomaly detection based on historical data
            # This would typically use more sophisticated algorithms
            historical_data = self._get_historical_data(metric_name)
            if not historical_data:
                return False
            
            mean_value = sum(historical_data) / len(historical_data)
            std_dev = (sum((x - mean_value) ** 2 for x in historical_data) / len(historical_data)) ** 0.5
            
            if std_dev == 0:
                return False
            
            z_score = abs(current_value - mean_value) / std_dev
            return z_score > (1 / sensitivity)
            
        except Exception as e:
            logger.error(f"Failed to evaluate anomaly rule: {e}")
            return False
    
    def _evaluate_pattern_rule(self, config: Dict[str, Any], metrics: Dict[str, Any]) -> bool:
        """Evaluate pattern-based alert rule"""
        try:
            pattern = config.get('pattern')
            metric_name = config.get('metric')
            
            if metric_name not in metrics:
                return False
            
            current_value = metrics[metric_name]
            
            # Simple pattern matching
            # This would typically use more sophisticated pattern recognition
            if pattern == 'increasing':
                historical_data = self._get_historical_data(metric_name)
                if len(historical_data) < 2:
                    return False
                
                return all(historical_data[i] < historical_data[i+1] for i in range(len(historical_data)-1))
            elif pattern == 'decreasing':
                historical_data = self._get_historical_data(metric_name)
                if len(historical_data) < 2:
                    return False
                
                return all(historical_data[i] > historical_data[i+1] for i in range(len(historical_data)-1))
            else:
                logger.warning(f"Unknown pattern: {pattern}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to evaluate pattern rule: {e}")
            return False
    
    def _get_historical_data(self, metric_name: str, hours: int = 24) -> List[float]:
        """Get historical data for a metric"""
        try:
            # This would typically fetch from a time-series database
            # For now, return empty list
            return []
            
        except Exception as e:
            logger.error(f"Failed to get historical data: {e}")
            return []
    
    def _create_alert(self, rule_name: str, rule: Dict[str, Any], metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Create an alert from a triggered rule"""
        try:
            alert = {
                'id': len(self.alert_history) + 1,
                'rule_name': rule_name,
                'severity': rule['config'].get('severity', 'warning'),
                'message': rule['config'].get('message', f"Alert triggered for rule '{rule_name}'"),
                'metrics': metrics,
                'timestamp': datetime.now().isoformat(),
                'acknowledged': False,
                'resolved': False
            }
            
            self.alert_history.append(alert)
            
            # Send notifications
            self._send_alert_notifications(alert)
            
            logger.warning(f"Alert triggered: {rule_name} - {alert['message']}")
            return alert
            
        except Exception as e:
            logger.error(f"Failed to create alert: {e}")
            return {}
    
    def _send_alert_notifications(self, alert: Dict[str, Any]):
        """Send alert notifications"""
        try:
            db = next(get_db())
            
            # Send to admins
            admin_users = db.query(Staff).filter(Staff.is_admin == True).all()
            
            for admin in admin_users:
                notification_service.create_notification(
                    db=db,
                    user_id=admin.id,
                    title=f"System Alert: {alert['rule_name']}",
                    message=alert['message'],
                    notification_type="alert",
                    priority=alert['severity'],
                    data=alert
                )
            
            # Send external notifications if configured
            if self.settings.sms_enabled:
                self._send_sms_alert(alert)
            
            if self.settings.email_enabled:
                self._send_email_alert(alert)
                
        except Exception as e:
            logger.error(f"Failed to send alert notifications: {e}")
    
    def _send_sms_alert(self, alert: Dict[str, Any]):
        """Send SMS alert"""
        try:
            # Get admin phone numbers
            db = next(get_db())
            admin_users = db.query(Staff).filter(Staff.is_admin == True).all()
            
            for admin in admin_users:
                if admin.phone:
                    message = f"ALERT: {alert['message']} - {alert['timestamp']}"
                    integration_service.send_sms(admin.phone, message)
                    
        except Exception as e:
            logger.error(f"Failed to send SMS alert: {e}")
    
    def _send_email_alert(self, alert: Dict[str, Any]):
        """Send email alert"""
        try:
            # Get admin email addresses
            db = next(get_db())
            admin_users = db.query(Staff).filter(Staff.is_admin == True).all()
            
            for admin in admin_users:
                if admin.email:
                    subject = f"System Alert: {alert['rule_name']}"
                    body = f"""
                    Alert Details:
                    Rule: {alert['rule_name']}
                    Message: {alert['message']}
                    Severity: {alert['severity']}
                    Timestamp: {alert['timestamp']}
                    
                    Metrics:
                    {json.dumps(alert['metrics'], indent=2)}
                    """
                    
                    integration_service.send_email(admin.email, subject, body)
                    
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
    
    def acknowledge_alert(self, alert_id: int) -> Dict[str, Any]:
        """Acknowledge an alert"""
        try:
            for alert in self.alert_history:
                if alert['id'] == alert_id:
                    alert['acknowledged'] = True
                    alert['acknowledged_at'] = datetime.now().isoformat()
                    
                    logger.info(f"Alert {alert_id} acknowledged")
                    return {
                        'success': True,
                        'message': f"Alert {alert_id} acknowledged"
                    }
            
            return {
                'success': False,
                'error': f"Alert {alert_id} not found"
            }
            
        except Exception as e:
            logger.error(f"Failed to acknowledge alert: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def resolve_alert(self, alert_id: int) -> Dict[str, Any]:
        """Resolve an alert"""
        try:
            for alert in self.alert_history:
                if alert['id'] == alert_id:
                    alert['resolved'] = True
                    alert['resolved_at'] = datetime.now().isoformat()
                    
                    logger.info(f"Alert {alert_id} resolved")
                    return {
                        'success': True,
                        'message': f"Alert {alert_id} resolved"
                    }
            
            return {
                'success': False,
                'error': f"Alert {alert_id} not found"
            }
            
        except Exception as e:
            logger.error(f"Failed to resolve alert: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_alert_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get alert history"""
        try:
            return self.alert_history[-limit:] if limit else self.alert_history
            
        except Exception as e:
            logger.error(f"Failed to get alert history: {e}")
            return []
    
    def get_alert_statistics(self) -> Dict[str, Any]:
        """Get alert statistics"""
        try:
            total_alerts = len(self.alert_history)
            acknowledged_alerts = len([a for a in self.alert_history if a['acknowledged']])
            resolved_alerts = len([a for a in self.alert_history if a['resolved']])
            
            # Group by severity
            severity_counts = {}
            for alert in self.alert_history:
                severity = alert['severity']
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            # Group by rule
            rule_counts = {}
            for alert in self.alert_history:
                rule_name = alert['rule_name']
                rule_counts[rule_name] = rule_counts.get(rule_name, 0) + 1
            
            return {
                'total_alerts': total_alerts,
                'acknowledged_alerts': acknowledged_alerts,
                'resolved_alerts': resolved_alerts,
                'unacknowledged_alerts': total_alerts - acknowledged_alerts,
                'unresolved_alerts': total_alerts - resolved_alerts,
                'severity_counts': severity_counts,
                'rule_counts': rule_counts
            }
            
        except Exception as e:
            logger.error(f"Failed to get alert statistics: {e}")
            return {}
    
    def update_alert_thresholds(self, thresholds: Dict[str, Any]) -> Dict[str, Any]:
        """Update alert thresholds"""
        try:
            self.alert_thresholds.update(thresholds)
            
            logger.info("Alert thresholds updated successfully")
            return {
                'success': True,
                'message': 'Alert thresholds updated successfully'
            }
            
        except Exception as e:
            logger.error(f"Failed to update alert thresholds: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_alerting_status(self) -> Dict[str, Any]:
        """Get alerting service status"""
        return {
            'alerting_active': self.alerting_active,
            'total_rules': len(self.alert_rules),
            'active_rules': len([r for r in self.alert_rules.values() if r['enabled']]),
            'total_alerts': len(self.alert_history),
            'unacknowledged_alerts': len([a for a in self.alert_history if not a['acknowledged']]),
            'unresolved_alerts': len([a for a in self.alert_history if not a['resolved']])
        }

# Global alerting service instance
alerting_service = AlertingService()