"""Redis fixed-window rate limiting for public chat requests."""

from __future__ import annotations

import time

from redis.asyncio import Redis


class RateLimitExceeded(Exception):
    pass


class RateLimiter:
    def __init__(self, redis: Redis, limit: int) -> None:
        self._redis = redis
        self._limit = limit

    async def check(self, identity: str) -> None:
        window = int(time.time() // 60)
        key = f"ai:rate:{identity}:{window}"
        try:
            async with self._redis.pipeline(transaction=True) as pipe:
                pipe.incr(key)
                pipe.expire(key, 90)
                count, _ = await pipe.execute()
        except Exception:
            return
        if int(count) > self._limit:
            raise RateLimitExceeded()
