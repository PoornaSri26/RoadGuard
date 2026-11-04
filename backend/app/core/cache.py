import redis
import json
from typing import Optional, Any
from app.core.config import settings
import pickle

class CacheService:
    """Redis caching service for performance optimization"""

    def __init__(self):
        try:
            self.redis_client = redis.Redis(
                host='localhost',
                port=6379,
                db=0,
                decode_responses=False,  # We'll handle encoding/decoding
                socket_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            self.enabled = True
        except Exception as e:
            print(f"Redis not available, caching disabled: {e}")
            self.enabled = False
            self.redis_client = None

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled:
            return None

        try:
            data = self.redis_client.get(key)
            if data:
                return pickle.loads(data)
            return None
        except Exception:
            return None

    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with TTL (default 5 minutes)"""
        if not self.enabled:
            return False

        try:
            self.redis_client.setex(key, ttl, pickle.dumps(value))
            return True
        except Exception:
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.enabled:
            return False

        try:
            self.redis_client.delete(key)
            return True
        except Exception:
            return False

    def invalidate_pattern(self, pattern: str) -> bool:
        """Delete all keys matching pattern"""
        if not self.enabled:
            return False

        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
            return True
        except Exception:
            return False

    def get_or_set(self, key: str, fetch_func, ttl: int = 300) -> Any:
        """Get from cache or compute and store"""
        cached = self.get(key)
        if cached is not None:
            return cached

        value = fetch_func()
        self.set(key, value, ttl)
        return value


cache_service = CacheService()
