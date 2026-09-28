"""SQL persistence operations for chats, knowledge, and audit records."""

from __future__ import annotations

import json
from typing import Any
from uuid import UUID

from assistant_core.contracts import ChatTurn

from .database import Database


class AssistantRepository:
    def __init__(self, database: Database) -> None:
        self._database = database

    async def ensure_domain(self, assistant_id: str, display_name: str) -> None:
        await self._database.require_pool().execute(
            """INSERT INTO assistant_domains (id, display_name) VALUES ($1, $2)
            ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name""",
            assistant_id,
            display_name,
        )

    async def create_conversation(self, assistant_id: str, visitor_id: str) -> UUID:
        return await self._database.require_pool().fetchval(
            """INSERT INTO conversations (assistant_id, visitor_id) VALUES ($1, $2)
            RETURNING id""",
            assistant_id,
            visitor_id,
        )

    async def conversation_exists(self, conversation_id: UUID, assistant_id: str) -> bool:
        return bool(await self._database.require_pool().fetchval(
            "SELECT EXISTS(SELECT 1 FROM conversations WHERE id = $1 AND assistant_id = $2)",
            conversation_id,
            assistant_id,
        ))

    async def history(self, conversation_id: UUID, limit: int) -> list[ChatTurn]:
        rows = await self._database.require_pool().fetch(
            """SELECT role, content FROM (
                SELECT role, content, id FROM chat_messages
                WHERE conversation_id = $1 ORDER BY id DESC LIMIT $2
            ) recent ORDER BY id ASC""",
            conversation_id,
            limit,
        )
        return [ChatTurn(role=row["role"], content=row["content"]) for row in rows]

    async def add_message(
        self, conversation_id: UUID, role: str, content: str, metadata: dict[str, Any]
    ) -> int:
        return await self._database.require_pool().fetchval(
            """INSERT INTO chat_messages (conversation_id, role, content, metadata)
            VALUES ($1, $2, $3, $4::jsonb) RETURNING id""",
            conversation_id,
            role,
            content,
            json.dumps(metadata, ensure_ascii=False),
        )

    async def add_feedback(self, message_id: int, rating: int, comment: str | None) -> None:
        await self._database.require_pool().execute(
            """INSERT INTO message_feedback (message_id, rating, comment) VALUES ($1, $2, $3)
            ON CONFLICT (message_id) DO UPDATE SET rating = EXCLUDED.rating,
            comment = EXCLUDED.comment, created_at = NOW()""",
            message_id,
            rating,
            comment,
        )

    async def create_document(
        self, assistant_id: str, title: str, content: str, source_url: str | None
    ) -> UUID:
        return await self._database.require_pool().fetchval(
            """INSERT INTO knowledge_documents
            (assistant_id, title, source_url, raw_content, status) VALUES ($1, $2, $3, $4, 'queued')
            RETURNING id""",
            assistant_id,
            title,
            source_url,
            content,
        )

    async def document(self, document_id: UUID) -> dict[str, Any] | None:
        row = await self._database.require_pool().fetchrow(
            """SELECT id, assistant_id, title, source_url, status, chunk_count, error_message,
            created_at, updated_at FROM knowledge_documents WHERE id = $1""",
            document_id,
        )
        return dict(row) if row else None

    async def vector_search(
        self, assistant_id: str, embedding: list[float], limit: int
    ) -> list[dict[str, Any]]:
        vector = "[" + ",".join(str(value) for value in embedding) + "]"
        rows = await self._database.require_pool().fetch(
            """SELECT c.id, c.content, d.title, d.source_url,
            1 - (c.embedding <=> $2::vector) AS score
            FROM knowledge_chunks c JOIN knowledge_documents d ON d.id = c.document_id
            WHERE c.assistant_id = $1 AND d.status = 'ready' AND c.embedding IS NOT NULL
            ORDER BY c.embedding <=> $2::vector LIMIT $3""",
            assistant_id,
            vector,
            limit,
        )
        return [dict(row) for row in rows]

    async def lexical_search(
        self, assistant_id: str, query: str, limit: int
    ) -> list[dict[str, Any]]:
        rows = await self._database.require_pool().fetch(
            """SELECT c.id, c.content, d.title, d.source_url, 0.0 AS score
            FROM knowledge_chunks c JOIN knowledge_documents d ON d.id = c.document_id
            WHERE c.assistant_id = $1 AND d.status = 'ready'
            AND c.content ILIKE '%' || $2 || '%'
            ORDER BY c.id DESC LIMIT $3""",
            assistant_id,
            query.strip(),
            limit,
        )
        return [dict(row) for row in rows]

    async def record_model_call(
        self, assistant_id: str, conversation_id: UUID, latency_ms: int, status: str
    ) -> None:
        await self._database.require_pool().execute(
            """INSERT INTO model_call_logs (assistant_id, conversation_id, provider, model,
            latency_ms, status) VALUES ($1, $2, 'deepseek', 'deepseek-chat', $3, $4)""",
            assistant_id,
            conversation_id,
            latency_ms,
            status,
        )
