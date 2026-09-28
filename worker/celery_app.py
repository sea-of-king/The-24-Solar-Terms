"""Celery configuration with acknowledgement and retry safety."""

from __future__ import annotations

from pathlib import Path

from celery import Celery
from celery.signals import worker_init, worker_ready

from assistant_core.queueing import configure_knowledge_queues, declare_knowledge_topology
from app.config import get_settings

settings = get_settings()
celery_app = Celery(
    "assistant-worker", broker=settings.broker_url, include=["worker.tasks"]
)
configure_knowledge_queues(celery_app)
celery_app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    task_time_limit=600,
    task_soft_time_limit=540,
    broker_connection_retry_on_startup=True,
    # RabbitMQ 4 disables Celery's legacy transient pidbox queues by default.
    # This worker only consumes the durable knowledge queue, so remote control
    # and event gossip are intentionally disabled.
    worker_enable_remote_control=False,
    worker_send_task_events=False,
    task_send_sent_event=False,
)


@worker_init.connect
def declare_worker_topology(**_: object) -> None:
    declare_knowledge_topology(celery_app)


@worker_ready.connect
def mark_worker_ready(**_: object) -> None:
    Path("/tmp/celery-worker.ready").touch()
