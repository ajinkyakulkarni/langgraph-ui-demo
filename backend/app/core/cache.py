import json
from typing import Optional, Dict, Any
from app.core.config import settings

class CacheInterface:
    async def get(self, key: str) -> Optional[str]:
        raise NotImplementedError
    
    async def set(self, key: str, value: str, expire: Optional[int] = None):
        raise NotImplementedError
    
    async def delete(self, key: str):
        raise NotImplementedError

class RedisCache(CacheInterface):
    def __init__(self):
        import redis
        self.client = redis.from_url(settings.REDIS_URL)
    
    async def get(self, key: str) -> Optional[str]:
        value = self.client.get(key)
        return value.decode() if value else None
    
    async def set(self, key: str, value: str, expire: Optional[int] = None):
        self.client.set(key, value, ex=expire)
    
    async def delete(self, key: str):
        self.client.delete(key)

class InMemoryCache(CacheInterface):
    def __init__(self):
        self._cache: Dict[str, Any] = {}
    
    async def get(self, key: str) -> Optional[str]:
        return self._cache.get(key)
    
    async def set(self, key: str, value: str, expire: Optional[int] = None):
        # Note: expire is ignored in this simple implementation
        self._cache[key] = value
    
    async def delete(self, key: str):
        self._cache.pop(key, None)

# Factory function to get cache instance
def get_cache() -> CacheInterface:
    if settings.REDIS_URL and settings.REDIS_URL != "none":
        try:
            return RedisCache()
        except Exception:
            print("Redis not available, falling back to in-memory cache")
            return InMemoryCache()
    else:
        return InMemoryCache()

cache = get_cache()