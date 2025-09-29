"""
Cache service for performance optimization
"""
import redis
import json
import pickle
from typing import Any, Optional, Union
from datetime import datetime, timedelta
import logging
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self.settings = get_settings()
        self.redis_client = None
        self._connect()
    
    def _connect(self):
        """Connect to Redis server"""
        try:
            self.redis_client = redis.Redis(
                host=self.settings.redis_host,
                port=self.settings.redis_port,
                password=self.settings.redis_password,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Connected to Redis cache server")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Using in-memory cache.")
            self.redis_client = None
    
    def _get_key(self, prefix: str, key: str) -> str:
        """Generate cache key with prefix"""
        return f"{prefix}:{key}"
    
    def set(self, key: str, value: Any, expire: Optional[int] = None, prefix: str = "app") -> bool:
        """Set cache value"""
        try:
            cache_key = self._get_key(prefix, key)
            
            # Serialize value
            if isinstance(value, (dict, list)):
                serialized_value = json.dumps(value, default=str)
            else:
                serialized_value = str(value)
            
            if self.redis_client:
                return self.redis_client.set(cache_key, serialized_value, ex=expire)
            else:
                # Fallback to in-memory cache
                return self._set_memory_cache(cache_key, serialized_value, expire)
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    def get(self, key: str, prefix: str = "app") -> Optional[Any]:
        """Get cache value"""
        try:
            cache_key = self._get_key(prefix, key)
            
            if self.redis_client:
                value = self.redis_client.get(cache_key)
            else:
                value = self._get_memory_cache(cache_key)
            
            if value is None:
                return None
            
            # Try to deserialize JSON
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
                
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    def delete(self, key: str, prefix: str = "app") -> bool:
        """Delete cache value"""
        try:
            cache_key = self._get_key(prefix, key)
            
            if self.redis_client:
                return bool(self.redis_client.delete(cache_key))
            else:
                return self._delete_memory_cache(cache_key)
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    def exists(self, key: str, prefix: str = "app") -> bool:
        """Check if cache key exists"""
        try:
            cache_key = self._get_key(prefix, key)
            
            if self.redis_client:
                return bool(self.redis_client.exists(cache_key))
            else:
                return cache_key in self._memory_cache
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False
    
    def clear_pattern(self, pattern: str, prefix: str = "app") -> int:
        """Clear cache keys matching pattern"""
        try:
            if self.redis_client:
                keys = self.redis_client.keys(f"{prefix}:{pattern}")
                if keys:
                    return self.redis_client.delete(*keys)
                return 0
            else:
                # Clear from memory cache
                return self._clear_memory_pattern(f"{prefix}:{pattern}")
        except Exception as e:
            logger.error(f"Cache clear pattern error: {e}")
            return 0
    
    def get_or_set(self, key: str, func, expire: Optional[int] = None, prefix: str = "app") -> Any:
        """Get from cache or set using function"""
        cached_value = self.get(key, prefix)
        if cached_value is not None:
            return cached_value
        
        # Execute function to get value
        value = func()
        if value is not None:
            self.set(key, value, expire, prefix)
        return value
    
    def increment(self, key: str, amount: int = 1, expire: Optional[int] = None, prefix: str = "app") -> int:
        """Increment cache value"""
        try:
            cache_key = self._get_key(prefix, key)
            
            if self.redis_client:
                result = self.redis_client.incrby(cache_key, amount)
                if expire:
                    self.redis_client.expire(cache_key, expire)
                return result
            else:
                # Fallback to memory cache
                return self._increment_memory_cache(cache_key, amount, expire)
        except Exception as e:
            logger.error(f"Cache increment error: {e}")
            return 0
    
    def set_hash(self, key: str, field: str, value: Any, prefix: str = "app") -> bool:
        """Set hash field"""
        try:
            cache_key = self._get_key(prefix, key)
            
            if self.redis_client:
                return bool(self.redis_client.hset(cache_key, field, json.dumps(value, default=str)))
            else:
                return self._set_memory_hash(cache_key, field, value)
        except Exception as e:
            logger.error(f"Cache set hash error: {e}")
            return False
    
    def get_hash(self, key: str, field: str, prefix: str = "app") -> Optional[Any]:
        """Get hash field"""
        try:
            cache_key = self._get_key(prefix, key)
            
            if self.redis_client:
                value = self.redis_client.hget(cache_key, field)
            else:
                value = self._get_memory_hash(cache_key, field)
            
            if value is None:
                return None
            
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            logger.error(f"Cache get hash error: {e}")
            return None
    
    def get_all_hash(self, key: str, prefix: str = "app") -> dict:
        """Get all hash fields"""
        try:
            cache_key = self._get_key(prefix, key)
            
            if self.redis_client:
                return self.redis_client.hgetall(cache_key)
            else:
                return self._get_all_memory_hash(cache_key)
        except Exception as e:
            logger.error(f"Cache get all hash error: {e}")
            return {}
    
    # Memory cache fallback methods
    def __init__(self):
        self.settings = get_settings()
        self.redis_client = None
        self._memory_cache = {}
        self._memory_cache_expiry = {}
        self._connect()
    
    def _set_memory_cache(self, key: str, value: str, expire: Optional[int] = None) -> bool:
        """Set value in memory cache"""
        try:
            self._memory_cache[key] = value
            if expire:
                self._memory_cache_expiry[key] = datetime.now() + timedelta(seconds=expire)
            return True
        except Exception as e:
            logger.error(f"Memory cache set error: {e}")
            return False
    
    def _get_memory_cache(self, key: str) -> Optional[str]:
        """Get value from memory cache"""
        try:
            # Check expiry
            if key in self._memory_cache_expiry:
                if datetime.now() > self._memory_cache_expiry[key]:
                    del self._memory_cache[key]
                    del self._memory_cache_expiry[key]
                    return None
            
            return self._memory_cache.get(key)
        except Exception as e:
            logger.error(f"Memory cache get error: {e}")
            return None
    
    def _delete_memory_cache(self, key: str) -> bool:
        """Delete value from memory cache"""
        try:
            if key in self._memory_cache:
                del self._memory_cache[key]
            if key in self._memory_cache_expiry:
                del self._memory_cache_expiry[key]
            return True
        except Exception as e:
            logger.error(f"Memory cache delete error: {e}")
            return False
    
    def _clear_memory_pattern(self, pattern: str) -> int:
        """Clear memory cache keys matching pattern"""
        try:
            import re
            pattern_re = re.compile(pattern.replace('*', '.*'))
            keys_to_delete = [key for key in self._memory_cache.keys() if pattern_re.match(key)]
            
            for key in keys_to_delete:
                del self._memory_cache[key]
                if key in self._memory_cache_expiry:
                    del self._memory_cache_expiry[key]
            
            return len(keys_to_delete)
        except Exception as e:
            logger.error(f"Memory cache clear pattern error: {e}")
            return 0
    
    def _increment_memory_cache(self, key: str, amount: int, expire: Optional[int] = None) -> int:
        """Increment value in memory cache"""
        try:
            current_value = int(self._memory_cache.get(key, 0))
            new_value = current_value + amount
            self._memory_cache[key] = str(new_value)
            
            if expire:
                self._memory_cache_expiry[key] = datetime.now() + timedelta(seconds=expire)
            
            return new_value
        except Exception as e:
            logger.error(f"Memory cache increment error: {e}")
            return 0
    
    def _set_memory_hash(self, key: str, field: str, value: Any) -> bool:
        """Set hash field in memory cache"""
        try:
            if key not in self._memory_cache:
                self._memory_cache[key] = {}
            self._memory_cache[key][field] = json.dumps(value, default=str)
            return True
        except Exception as e:
            logger.error(f"Memory cache set hash error: {e}")
            return False
    
    def _get_memory_hash(self, key: str, field: str) -> Optional[str]:
        """Get hash field from memory cache"""
        try:
            if key in self._memory_cache and isinstance(self._memory_cache[key], dict):
                return self._memory_cache[key].get(field)
            return None
        except Exception as e:
            logger.error(f"Memory cache get hash error: {e}")
            return None
    
    def _get_all_memory_hash(self, key: str) -> dict:
        """Get all hash fields from memory cache"""
        try:
            if key in self._memory_cache and isinstance(self._memory_cache[key], dict):
                return self._memory_cache[key]
            return {}
        except Exception as e:
            logger.error(f"Memory cache get all hash error: {e}")
            return {}

# Cache decorators
def cache_result(expire: int = 300, prefix: str = "app"):
    """Decorator to cache function results"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            cache_service = CacheService()
            cached_result = cache_service.get(cache_key, prefix)
            
            if cached_result is not None:
                return cached_result
            
            result = func(*args, **kwargs)
            if result is not None:
                cache_service.set(cache_key, result, expire, prefix)
            
            return result
        return wrapper
    return decorator

def cache_invalidate(pattern: str, prefix: str = "app"):
    """Decorator to invalidate cache on function call"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # Invalidate cache
            cache_service = CacheService()
            cache_service.clear_pattern(pattern, prefix)
            
            return result
        return wrapper
    return decorator

# Global cache service instance
cache_service = CacheService()