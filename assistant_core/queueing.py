"""Shared durable RabbitMQ topology for knowledge ingestion."""

from __future__ import annotations

from celery import Celery
from kombu import Exchange, Queue

KNOWLEDGE_EXCHANGE = Exchange("knowledge", type="direct", durable=True)
KNOWLEDGE_DLX = Exchange("knowledge.dlx", type="direct", durable=True)
KNOWLEDGE_QUEUE = Queue(
    "knowledge",
    exchange=KNOWLEDGE_EXCHANGE,
    routing_key="knowledge",
    durable=True,
    queue_arguments={
        "x-dead-letter-exchange": "knowledge.dlx",
        "x-dead-letter-routing-key": "knowledge.failed",
    },
)
KNOWLEDGE_DLQ = Queue(
    "knowledge.dlq",
    exchange=KNOWLEDGE_DLX,
    routing_key="knowledge.failed",
    durable=True,
)


def configure_knowledge_queues(celery: Celery) -> None:
    """Apply the same queue declaration to API producers and workers."""
    celery.conf.update(
        task_queues=(KNOWLEDGE_QUEUE, KNOWLEDGE_DLQ),
        task_default_queue="knowledge",
        task_default_exchange="knowledge",
        task_default_exchange_type="direct",
        task_default_routing_key="knowledge",
        task_default_delivery_mode="persistent",
        task_routes={"knowledge.*": {"queue": "knowledge", "routing_key": "knowledge"}},
    )


def declare_knowledge_topology(celery: Celery) -> None:
    """Declare every entity even when the worker consumes only the primary queue."""
    with celery.connection_for_write() as connection:
        channel = connection.channel()
        try:
            for entity in (KNOWLEDGE_EXCHANGE, KNOWLEDGE_DLX, KNOWLEDGE_QUEUE, KNOWLEDGE_DLQ):
                entity(channel).declare()
        finally:
            channel.close()
