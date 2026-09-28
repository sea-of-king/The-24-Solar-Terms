"""Async PostgreSQL pool lifecycle."""

from __future__ import annotations

import asyncpg


class Database:
    def __init__(self, url: str, min_size: int = 1, max_size: int = 10, command_timeout: int = 15) -> None:
        self._url = url
        self._min_size = min_size
        self._max_size = max(max_size, min_size)
        self._command_timeout = command_timeout
        self.pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        self.pool = await asyncpg.create_pool(
            self._url,
            min_size=self._min_size,
            max_size=self._max_size,
            command_timeout=self._command_timeout,
            max_inactive_connection_lifetime=300,
        )

    async def close(self) -> None:
        if self.pool is not None:
            await self.pool.close()
            self.pool = None

    def require_pool(self) -> asyncpg.Pool:
        if self.pool is None:
            raise RuntimeError("Database pool is not initialized.")
        return self.pool

    async def healthy(self) -> bool:
        try:
            await self.require_pool().fetchval("SELECT 1")
            return True
        except Exception:
            return False
