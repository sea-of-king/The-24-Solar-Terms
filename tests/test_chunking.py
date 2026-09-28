"""Tests for deterministic, idempotent knowledge document chunking."""

from __future__ import annotations

import unittest

from app.config import Settings
from app.rag import LlamaIndexEmbeddingClient
from worker.chunking import chunk_text


class ChunkingTests(unittest.TestCase):
    def test_empty_content_has_no_chunks(self) -> None:
        self.assertEqual(chunk_text(" \n \n"), [])

    def test_long_content_is_chunked_with_bounded_size(self) -> None:
        text = "甲" * 500 + "。" + "乙" * 500 + "。" + "丙" * 500
        chunks = chunk_text(text, chunk_size=600, overlap=80)

        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(chunk for chunk in chunks))
        self.assertEqual(chunks, chunk_text(text, chunk_size=600, overlap=80))

    def test_embedding_is_optional_without_provider_configuration(self) -> None:
        settings = Settings(
            database_url="postgresql://test",
            redis_url="redis://test",
            broker_url="amqp://test",
            deepseek_api_key=None,
            deepseek_base_url="https://example.test/v1",
            embedding_api_key=None,
            embedding_base_url=None,
            embedding_model="text-embedding-3-small",
            embedding_dimensions=1536,
            default_assistant_id="solar-terms",
            admin_api_key=None,
            cors_origins=(),
            rate_limit_per_minute=30,
            max_history_messages=12,
            retrieval_limit=5,
            database_pool_min_size=1,
            database_pool_max_size=10,
            database_command_timeout_seconds=15,
        )

        self.assertIsNone(LlamaIndexEmbeddingClient(settings).embed_text("节气知识"))
