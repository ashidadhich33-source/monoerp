"""
Performance optimization service
"""
import time
import asyncio
from typing import Any, Dict, List, Optional, Callable
from functools import wraps
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.services.cache_service import cache_service, cache_result, cache_invalidate
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

class PerformanceService:
    def __init__(self):
        self.settings = get_settings()
        self.query_cache = {}
        self.performance_metrics = {}
    
    def track_performance(self, operation_name: str):
        """Decorator to track performance metrics"""
        def decorator(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    execution_time = time.time() - start_time
                    self._record_metric(operation_name, execution_time, success=True)
                    return result
                except Exception as e:
                    execution_time = time.time() - start_time
                    self._record_metric(operation_name, execution_time, success=False)
                    logger.error(f"Performance tracking error for {operation_name}: {e}")
                    raise
            
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    execution_time = time.time() - start_time
                    self._record_metric(operation_name, execution_time, success=True)
                    return result
                except Exception as e:
                    execution_time = time.time() - start_time
                    self._record_metric(operation_name, execution_time, success=False)
                    logger.error(f"Performance tracking error for {operation_name}: {e}")
                    raise
            
            return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
        return decorator
    
    def _record_metric(self, operation_name: str, execution_time: float, success: bool):
        """Record performance metric"""
        if operation_name not in self.performance_metrics:
            self.performance_metrics[operation_name] = {
                'total_calls': 0,
                'total_time': 0.0,
                'success_count': 0,
                'error_count': 0,
                'avg_time': 0.0,
                'min_time': float('inf'),
                'max_time': 0.0,
                'last_updated': datetime.now()
            }
        
        metric = self.performance_metrics[operation_name]
        metric['total_calls'] += 1
        metric['total_time'] += execution_time
        metric['avg_time'] = metric['total_time'] / metric['total_calls']
        metric['min_time'] = min(metric['min_time'], execution_time)
        metric['max_time'] = max(metric['max_time'], execution_time)
        metric['last_updated'] = datetime.now()
        
        if success:
            metric['success_count'] += 1
        else:
            metric['error_count'] += 1
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        return self.performance_metrics
    
    def get_slow_operations(self, threshold: float = 1.0) -> List[Dict[str, Any]]:
        """Get operations slower than threshold"""
        slow_ops = []
        for operation, metrics in self.performance_metrics.items():
            if metrics['avg_time'] > threshold:
                slow_ops.append({
                    'operation': operation,
                    'avg_time': metrics['avg_time'],
                    'max_time': metrics['max_time'],
                    'total_calls': metrics['total_calls']
                })
        return sorted(slow_ops, key=lambda x: x['avg_time'], reverse=True)
    
    def optimize_database_queries(self, db: Session) -> Dict[str, Any]:
        """Analyze and optimize database queries"""
        try:
            # Get query statistics
            query_stats = db.execute(text("""
                SELECT 
                    query,
                    calls,
                    total_time,
                    mean_time,
                    rows
                FROM pg_stat_statements 
                ORDER BY mean_time DESC 
                LIMIT 10
            """)).fetchall()
            
            # Get table statistics
            table_stats = db.execute(text("""
                SELECT 
                    schemaname,
                    tablename,
                    n_tup_ins as inserts,
                    n_tup_upd as updates,
                    n_tup_del as deletes,
                    n_live_tup as live_tuples,
                    n_dead_tup as dead_tuples
                FROM pg_stat_user_tables
                ORDER BY n_live_tup DESC
            """)).fetchall()
            
            # Get index usage
            index_stats = db.execute(text("""
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan as scans,
                    idx_tup_read as tuples_read,
                    idx_tup_fetch as tuples_fetched
                FROM pg_stat_user_indexes
                WHERE idx_scan > 0
                ORDER BY idx_scan DESC
            """)).fetchall()
            
            return {
                'slow_queries': [dict(row) for row in query_stats],
                'table_stats': [dict(row) for row in table_stats],
                'index_stats': [dict(row) for row in index_stats],
                'recommendations': self._generate_optimization_recommendations(query_stats, table_stats, index_stats)
            }
            
        except Exception as e:
            logger.error(f"Database optimization analysis failed: {e}")
            return {'error': str(e)}
    
    def _generate_optimization_recommendations(self, query_stats, table_stats, index_stats) -> List[str]:
        """Generate optimization recommendations"""
        recommendations = []
        
        # Analyze slow queries
        for query in query_stats:
            if query.mean_time > 1000:  # Queries taking more than 1 second
                recommendations.append(f"Optimize slow query: {query.query[:100]}... (avg: {query.mean_time:.2f}ms)")
        
        # Analyze table statistics
        for table in table_stats:
            if table.dead_tuples > table.live_tuples * 0.1:  # More than 10% dead tuples
                recommendations.append(f"Consider VACUUM for table {table.tablename} (dead tuples: {table.dead_tuples})")
        
        # Analyze index usage
        unused_indexes = [idx for idx in index_stats if idx.scans == 0]
        if unused_indexes:
            recommendations.append(f"Consider removing unused indexes: {[idx.indexname for idx in unused_indexes[:5]]}")
        
        return recommendations
    
    def cache_dashboard_data(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Cache dashboard data with smart invalidation"""
        cache_key = f"dashboard:{user_id}"
        
        def fetch_dashboard_data():
            # This would contain the actual dashboard data fetching logic
            # For now, returning a placeholder
            return {
                'user_id': user_id,
                'timestamp': datetime.now().isoformat(),
                'data': 'dashboard_data_here'
            }
        
        return cache_service.get_or_set(
            cache_key,
            fetch_dashboard_data,
            expire=self.settings.cache_dashboard_ttl,
            prefix="dashboard"
        )
    
    def cache_report_data(self, report_type: str, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Cache report data"""
        cache_key = f"report:{report_type}:{hash(str(filters))}"
        
        def fetch_report_data():
            # This would contain the actual report data fetching logic
            return {
                'report_type': report_type,
                'filters': filters,
                'timestamp': datetime.now().isoformat(),
                'data': 'report_data_here'
            }
        
        return cache_service.get_or_set(
            cache_key,
            fetch_report_data,
            expire=self.settings.cache_reports_ttl,
            prefix="reports"
        )
    
    def invalidate_user_cache(self, user_id: int):
        """Invalidate all cache for a specific user"""
        patterns = [
            f"dashboard:{user_id}",
            f"notifications:{user_id}",
            f"attendance:{user_id}",
            f"sales:{user_id}",
            f"salary:{user_id}"
        ]
        
        for pattern in patterns:
            cache_service.clear_pattern(pattern, "user")
    
    def invalidate_system_cache(self):
        """Invalidate system-wide cache"""
        system_patterns = [
            "dashboard:*",
            "reports:*",
            "staff:*",
            "brands:*",
            "targets:*"
        ]
        
        for pattern in system_patterns:
            cache_service.clear_pattern(pattern, "system")
    
    def get_cache_statistics(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if cache_service.redis_client:
            try:
                info = cache_service.redis_client.info()
                return {
                    'redis_version': info.get('redis_version'),
                    'used_memory': info.get('used_memory_human'),
                    'connected_clients': info.get('connected_clients'),
                    'total_commands_processed': info.get('total_commands_processed'),
                    'keyspace_hits': info.get('keyspace_hits'),
                    'keyspace_misses': info.get('keyspace_misses'),
                    'hit_rate': info.get('keyspace_hits', 0) / (info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1)) * 100
                }
            except Exception as e:
                logger.error(f"Failed to get Redis statistics: {e}")
                return {'error': str(e)}
        else:
            return {
                'cache_type': 'memory',
                'memory_cache_size': len(cache_service._memory_cache),
                'performance_metrics': len(self.performance_metrics)
            }
    
    def optimize_api_response(self, data: Any, max_size: int = 1024 * 1024) -> Any:
        """Optimize API response size"""
        if isinstance(data, dict):
            # Remove null values and empty strings
            optimized_data = {k: v for k, v in data.items() if v is not None and v != ""}
            
            # Truncate large text fields
            for key, value in optimized_data.items():
                if isinstance(value, str) and len(value) > 1000:
                    optimized_data[key] = value[:1000] + "..."
            
            return optimized_data
        
        elif isinstance(data, list):
            # Limit list size
            if len(data) > 100:
                return data[:100] + [{"message": f"... and {len(data) - 100} more items"}]
            
            return data
        
        return data
    
    def batch_process(self, items: List[Any], batch_size: int = 100, processor: Callable) -> List[Any]:
        """Process items in batches for better performance"""
        results = []
        
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            batch_results = processor(batch)
            results.extend(batch_results)
            
            # Add small delay to prevent overwhelming the system
            time.sleep(0.01)
        
        return results
    
    def async_batch_process(self, items: List[Any], batch_size: int = 100, processor: Callable) -> List[Any]:
        """Process items in batches asynchronously"""
        async def process_batch(batch):
            return processor(batch)
        
        async def process_all():
            tasks = []
            for i in range(0, len(items), batch_size):
                batch = items[i:i + batch_size]
                task = process_batch(batch)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks)
            return [item for sublist in results for item in sublist]
        
        return asyncio.run(process_all())

# Performance decorators
def cache_dashboard(expire: int = 60):
    """Cache dashboard data"""
    return cache_result(expire=expire, prefix="dashboard")

def cache_reports(expire: int = 300):
    """Cache report data"""
    return cache_result(expire=expire, prefix="reports")

def cache_static_data(expire: int = 3600):
    """Cache static data"""
    return cache_result(expire=expire, prefix="static")

def invalidate_cache_on_update(pattern: str):
    """Invalidate cache when data is updated"""
    return cache_invalidate(pattern=pattern, prefix="system")

# Global performance service instance
performance_service = PerformanceService()