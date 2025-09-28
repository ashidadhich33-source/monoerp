"""
Performance monitoring and optimization service
"""
import time
import psutil
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.performance_metrics import PerformanceMetric
from app.models.base import get_db
import json

logger = logging.getLogger(__name__)

class PerformanceService:
    def __init__(self):
        self.metrics_cache = {}
        self.performance_thresholds = {
            'response_time': 2.0,  # seconds
            'cpu_usage': 80.0,    # percentage
            'memory_usage': 85.0,  # percentage
            'disk_usage': 90.0     # percentage
        }
    
    def record_response_time(self, endpoint: str, method: str, response_time: float, status_code: int):
        """Record API response time"""
        try:
            metric = {
                'endpoint': endpoint,
                'method': method,
                'response_time': response_time,
                'status_code': status_code,
                'timestamp': datetime.now()
            }
            
            # Log if response time exceeds threshold
            if response_time > self.performance_thresholds['response_time']:
                logger.warning(f"Slow response detected: {endpoint} took {response_time:.2f}s")
            
            # Store in cache for batch processing
            cache_key = f"{endpoint}_{method}"
            if cache_key not in self.metrics_cache:
                self.metrics_cache[cache_key] = []
            
            self.metrics_cache[cache_key].append(metric)
            
        except Exception as e:
            logger.error(f"Failed to record response time: {e}")
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system performance metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used = memory.used / (1024**3)  # GB
            memory_total = memory.total / (1024**3)  # GB
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            disk_used = disk.used / (1024**3)  # GB
            disk_total = disk.total / (1024**3)  # GB
            
            # Network I/O
            network = psutil.net_io_counters()
            
            # Process count
            process_count = len(psutil.pids())
            
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'cpu': {
                    'usage_percent': cpu_percent,
                    'count': psutil.cpu_count()
                },
                'memory': {
                    'usage_percent': memory_percent,
                    'used_gb': round(memory_used, 2),
                    'total_gb': round(memory_total, 2)
                },
                'disk': {
                    'usage_percent': round(disk_percent, 2),
                    'used_gb': round(disk_used, 2),
                    'total_gb': round(disk_total, 2)
                },
                'network': {
                    'bytes_sent': network.bytes_sent,
                    'bytes_recv': network.bytes_recv,
                    'packets_sent': network.packets_sent,
                    'packets_recv': network.packets_recv
                },
                'processes': {
                    'count': process_count
                }
            }
            
            # Check for performance issues
            alerts = []
            if cpu_percent > self.performance_thresholds['cpu_usage']:
                alerts.append(f"High CPU usage: {cpu_percent:.1f}%")
            
            if memory_percent > self.performance_thresholds['memory_usage']:
                alerts.append(f"High memory usage: {memory_percent:.1f}%")
            
            if disk_percent > self.performance_thresholds['disk_usage']:
                alerts.append(f"High disk usage: {disk_percent:.1f}%")
            
            metrics['alerts'] = alerts
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get system metrics: {e}")
            return {}
    
    def get_database_metrics(self, db: Session) -> Dict[str, Any]:
        """Get database performance metrics"""
        try:
            # Get database connection info
            connection_info = db.get_bind().get_connection().get_connection()
            
            # Get query execution time
            start_time = time.time()
            db.execute("SELECT 1")
            query_time = time.time() - start_time
            
            # Get database size (PostgreSQL)
            try:
                size_result = db.execute("SELECT pg_size_pretty(pg_database_size(current_database()))").fetchone()
                db_size = size_result[0] if size_result else "Unknown"
            except:
                db_size = "Unknown"
            
            # Get active connections
            try:
                connections_result = db.execute("SELECT count(*) FROM pg_stat_activity").fetchone()
                active_connections = connections_result[0] if connections_result else 0
            except:
                active_connections = 0
            
            return {
                'timestamp': datetime.now().isoformat(),
                'query_time': round(query_time, 4),
                'database_size': db_size,
                'active_connections': active_connections,
                'connection_pool': {
                    'size': db.get_bind().pool.size(),
                    'checked_in': db.get_bind().pool.checkedin(),
                    'checked_out': db.get_bind().pool.checkedout(),
                    'overflow': db.get_bind().pool.overflow(),
                    'invalid': db.get_bind().pool.invalid()
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get database metrics: {e}")
            return {}
    
    def get_api_metrics(self, db: Session, hours: int = 24) -> Dict[str, Any]:
        """Get API performance metrics"""
        try:
            start_time = datetime.now() - timedelta(hours=hours)
            
            # Get response time statistics
            metrics = db.query(PerformanceMetric).filter(
                PerformanceMetric.timestamp >= start_time,
                PerformanceMetric.metric_type == 'response_time'
            ).all()
            
            if not metrics:
                return {"message": "No metrics available for the specified period"}
            
            response_times = [float(m.value) for m in metrics]
            
            # Calculate statistics
            avg_response_time = sum(response_times) / len(response_times)
            min_response_time = min(response_times)
            max_response_time = max(response_times)
            
            # Get endpoint performance
            endpoint_stats = {}
            for metric in metrics:
                endpoint = metric.details.get('endpoint', 'unknown')
                if endpoint not in endpoint_stats:
                    endpoint_stats[endpoint] = []
                endpoint_stats[endpoint].append(float(metric.value))
            
            # Calculate endpoint averages
            endpoint_averages = {}
            for endpoint, times in endpoint_stats.items():
                endpoint_averages[endpoint] = {
                    'avg_time': sum(times) / len(times),
                    'count': len(times),
                    'min_time': min(times),
                    'max_time': max(times)
                }
            
            return {
                'period_hours': hours,
                'total_requests': len(metrics),
                'response_time': {
                    'average': round(avg_response_time, 4),
                    'minimum': round(min_response_time, 4),
                    'maximum': round(max_response_time, 4)
                },
                'endpoints': endpoint_averages
            }
            
        except Exception as e:
            logger.error(f"Failed to get API metrics: {e}")
            return {}
    
    def record_metric(
        self,
        db: Session,
        metric_type: str,
        value: float,
        details: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Record a performance metric"""
        try:
            metric = PerformanceMetric(
                metric_type=metric_type,
                value=value,
                details=details or {},
                timestamp=datetime.now()
            )
            
            db.add(metric)
            db.commit()
            
            return {"success": True, "metric_id": metric.id}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to record metric: {e}")
            return {"success": False, "error": str(e)}
    
    def get_performance_summary(self, db: Session) -> Dict[str, Any]:
        """Get overall performance summary"""
        try:
            # Get system metrics
            system_metrics = self.get_system_metrics()
            
            # Get database metrics
            db_metrics = self.get_database_metrics(db)
            
            # Get API metrics
            api_metrics = self.get_api_metrics(db, hours=1)
            
            # Calculate performance score
            performance_score = self.calculate_performance_score(system_metrics, db_metrics, api_metrics)
            
            return {
                'timestamp': datetime.now().isoformat(),
                'performance_score': performance_score,
                'system': system_metrics,
                'database': db_metrics,
                'api': api_metrics,
                'status': self.get_performance_status(performance_score)
            }
            
        except Exception as e:
            logger.error(f"Failed to get performance summary: {e}")
            return {}
    
    def calculate_performance_score(
        self,
        system_metrics: Dict[str, Any],
        db_metrics: Dict[str, Any],
        api_metrics: Dict[str, Any]
    ) -> int:
        """Calculate overall performance score (0-100)"""
        try:
            score = 100
            
            # System metrics scoring
            if 'cpu' in system_metrics:
                cpu_usage = system_metrics['cpu']['usage_percent']
                if cpu_usage > 90:
                    score -= 30
                elif cpu_usage > 80:
                    score -= 20
                elif cpu_usage > 70:
                    score -= 10
            
            if 'memory' in system_metrics:
                memory_usage = system_metrics['memory']['usage_percent']
                if memory_usage > 90:
                    score -= 25
                elif memory_usage > 80:
                    score -= 15
                elif memory_usage > 70:
                    score -= 5
            
            if 'disk' in system_metrics:
                disk_usage = system_metrics['disk']['usage_percent']
                if disk_usage > 95:
                    score -= 20
                elif disk_usage > 90:
                    score -= 10
                elif disk_usage > 85:
                    score -= 5
            
            # Database metrics scoring
            if 'query_time' in db_metrics:
                query_time = db_metrics['query_time']
                if query_time > 1.0:
                    score -= 15
                elif query_time > 0.5:
                    score -= 10
                elif query_time > 0.2:
                    score -= 5
            
            # API metrics scoring
            if 'response_time' in api_metrics:
                avg_response_time = api_metrics['response_time']['average']
                if avg_response_time > 5.0:
                    score -= 20
                elif avg_response_time > 2.0:
                    score -= 15
                elif avg_response_time > 1.0:
                    score -= 10
            
            return max(0, min(100, score))
            
        except Exception as e:
            logger.error(f"Failed to calculate performance score: {e}")
            return 50
    
    def get_performance_status(self, score: int) -> str:
        """Get performance status based on score"""
        if score >= 90:
            return "excellent"
        elif score >= 80:
            return "good"
        elif score >= 70:
            return "fair"
        elif score >= 60:
            return "poor"
        else:
            return "critical"
    
    def cleanup_old_metrics(self, db: Session, days: int = 30) -> Dict[str, Any]:
        """Clean up old performance metrics"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            deleted_count = db.query(PerformanceMetric).filter(
                PerformanceMetric.timestamp < cutoff_date
            ).delete()
            
            db.commit()
            
            return {
                "success": True,
                "deleted_count": deleted_count,
                "message": f"Cleaned up {deleted_count} old performance metrics"
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to cleanup old metrics: {e}")
            return {"success": False, "error": str(e)}

# Global performance service instance
performance_service = PerformanceService()