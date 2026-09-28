"""Environment-backed configuration for the AI service."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


def _csv(name: str, default: str) -> tuple[str, ...]:
    value = os.getenv(name, default)
    return tuple(item.strip() for item in value.split(",") if item.strip())


def _positive_int(name: str, default: int, minimum: int = 1) -> int:
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError:
        return default
    return value if value >= minimum else default


@dataclass(frozen=True)
class Settings:
    database_url: str
    redis_url: str
    broker_url: str
    deepseek_api_key: str | None
    deepseek_base_url: str
    embedding_api_key: str | None
    embedding_base_url: str | None
    embedding_model: str
    embedding_dimensions: int
    default_assistant_id: str
    admin_api_key: str | None
    cors_origins: tuple[str, ...]
    rate_limit_per_minute: int
    max_history_messages: int
    retrieval_limit: int
    database_pool_min_size: int
    database_pool_max_size: int
    database_command_timeout_seconds: int


@lru_cache
def get_settings() -> Settings:
    return Settings(
        database_url=os.getenv(
            "AI_DATABASE_URL", "postgresql://assistant:assistant@127.0.0.1:5432/assistant"
        ),
        redis_url=os.getenv("AI_REDIS_URL", "redis://127.0.0.1:6379/1"),
        broker_url=os.getenv(
            "CELERY_BROKER_URL", "amqp://assistant:assistant@127.0.0.1:5672/assistant"
        ),
        deepseek_api_key=os.getenv("DEEPSEEK_API_KEY") or None,
        deepseek_base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
        embedding_api_key=os.getenv("EMBEDDING_API_KEY") or None,
        embedding_base_url=os.getenv("EMBEDDING_BASE_URL") or None,
        embedding_model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
        embedding_dimensions=_positive_int("EMBEDDING_DIMENSIONS", 1536),
        default_assistant_id=os.getenv("DEFAULT_ASSISTANT_ID", "solar-terms"),
        admin_api_key=os.getenv("ADMIN_API_KEY") or None,
        cors_origins=_csv("CORS_ORIGINS", "http://localhost,http://127.0.0.1"),
        rate_limit_per_minute=_positive_int("RATE_LIMIT_PER_MINUTE", 30),
        max_history_messages=_positive_int("MAX_HISTORY_MESSAGES", 12),
        retrieval_limit=_positive_int("RETRIEVAL_LIMIT", 5),
        database_pool_min_size=_positive_int("AI_DATABASE_POOL_MIN_SIZE", 1),
        database_pool_max_size=_positive_int("AI_DATABASE_POOL_MAX_SIZE", 10),
        database_command_timeout_seconds=_positive_int("AI_DATABASE_COMMAND_TIMEOUT_SECONDS", 15),
    )
