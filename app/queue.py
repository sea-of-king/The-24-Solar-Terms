"""Queue producer for durable knowledge ingestion jobs."""

from __future__ import annotations

from uuid import UUID

from celery import Celery

from assistant_core.queueing import configure_knowledge_queues, declare_knowledge_topology


class KnowledgeQueue:
    def __init__(self, broker_url: str) -> None:
        self._celery = Celery("assistant-api", broker=broker_url)
        configure_knowledge_queues(self._celery)
        declare_knowledge_topology(self._celery)

    def enqueue_ingestion(self, document_id: UUID) -> str:
        task = self._celery.send_task("knowledge.ingest_document", args=[str(document_id)])
        return task.id
