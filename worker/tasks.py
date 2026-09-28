"""Idempotent document ingestion task with optional embedding generation."""

from __future__ import annotations

import json
from uuid import UUID

import psycopg
from celery import Task

from app.config import get_settings
from app.rag import EmbeddingProviderError, LlamaIndexEmbeddingClient

from .celery_app import celery_app
from .chunking import chunk_text


def _embed(text: str) -> list[float] | None:
    return LlamaIndexEmbeddingClient(get_settings()).embed_text(text)


class KnowledgeIngestionTask(Task):
    """Persist a terminal document state after Celery has exhausted retries."""

    def on_failure(self, exc, task_id, args, kwargs, einfo) -> None:  # type: ignore[no-untyped-def]
        if not args:
            return
        try:
            document_id = UUID(str(args[0]))
            with psycopg.connect(get_settings().database_url, autocommit=True) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """UPDATE knowledge_documents
                        SET status = 'failed', error_message = %s, updated_at = NOW()
                        WHERE id = %s AND status <> 'ready'""",
                        (str(exc)[:1000], document_id),
                    )
        except Exception:
            # The original exception remains the task failure; audit recovery must not mask it.
            return


@celery_app.task(
    bind=True,
    base=KnowledgeIngestionTask,
    name="knowledge.ingest_document",
    autoretry_for=(EmbeddingProviderError,),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=5,
)
def ingest_document(self, document_id: str) -> dict[str, int | str]:
    """Ingest one document without holding a database transaction during embedding I/O."""
    settings = get_settings()
    identifier = UUID(document_id)
    with psycopg.connect(settings.database_url, autocommit=True) as connection:
        lock_key = str(identifier)
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_try_advisory_lock(hashtext(%s))", (lock_key,))
            if not cursor.fetchone()[0]:
                return {"documentId": document_id, "status": "processing"}
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """SELECT assistant_id, raw_content, status FROM knowledge_documents
                    WHERE id = %s""",
                    (identifier,),
                )
                record = cursor.fetchone()
                if record is None:
                    return {"documentId": document_id, "status": "missing"}
                assistant_id, raw_content, current_status = record
                if current_status == "ready":
                    return {"documentId": document_id, "status": "ready"}
                cursor.execute(
                    """UPDATE knowledge_documents
                    SET status = 'processing', error_message = NULL, updated_at = NOW() WHERE id = %s""",
                    (identifier,),
                )

            # Network embedding calls run without locking database rows or a transaction.
            prepared_chunks = [
                (index, content, _embed(content))
                for index, content in enumerate(chunk_text(raw_content))
            ]
            with connection.transaction():
                with connection.cursor() as cursor:
                    cursor.execute("DELETE FROM knowledge_chunks WHERE document_id = %s", (identifier,))
                    for index, content, embedding in prepared_chunks:
                        metadata = json.dumps({"chunkIndex": index})
                        if embedding is None:
                            cursor.execute(
                                """INSERT INTO knowledge_chunks
                                (document_id, assistant_id, content, metadata) VALUES (%s, %s, %s, %s::jsonb)""",
                                (identifier, assistant_id, content, metadata),
                            )
                        else:
                            vector = "[" + ",".join(str(value) for value in embedding) + "]"
                            cursor.execute(
                                """INSERT INTO knowledge_chunks
                                (document_id, assistant_id, content, metadata, embedding)
                                VALUES (%s, %s, %s, %s::jsonb, %s::vector)""",
                                (identifier, assistant_id, content, metadata, vector),
                            )
                    cursor.execute(
                        """UPDATE knowledge_documents SET status = 'ready', chunk_count = %s,
                        updated_at = NOW() WHERE id = %s""",
                        (len(prepared_chunks), identifier),
                    )
            return {"documentId": document_id, "status": "ready", "chunks": len(prepared_chunks)}
        finally:
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_advisory_unlock(hashtext(%s))", (lock_key,))
