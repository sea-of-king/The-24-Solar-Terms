"""FastAPI service for chat, knowledge ingestion, and operations endpoints."""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator
from uuid import UUID

from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
from pydantic import BaseModel, Field, HttpUrl
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from redis.asyncio import Redis

from assistant_core.contracts import AssistantContext
from assistant_core.service import AssistantService, UnknownAssistantDomainError
from assistant_factory import create_assistant_service

from .config import Settings, get_settings
from .database import Database
from .queue import KnowledgeQueue
from .rag import LlamaIndexEmbeddingClient, RetrievalService
from .rate_limit import RateLimitExceeded, RateLimiter
from .repository import AssistantRepository

logger = logging.getLogger("assistant-api")
REQUEST_COUNT = Counter("assistant_http_requests_total", "HTTP requests", ["path", "status"])
CHAT_LATENCY = Histogram("assistant_chat_latency_seconds", "Chat request latency")


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=4000)
    assistant_id: str | None = Field(default=None, alias="assistantId", max_length=80)
    conversation_id: UUID | None = Field(default=None, alias="conversationId")


class FeedbackRequest(BaseModel):
    rating: int = Field(ge=-1, le=1)
    comment: str | None = Field(default=None, max_length=1000)


class KnowledgeDocumentRequest(BaseModel):
    assistant_id: str = Field(alias="assistantId", min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=240)
    content: str = Field(min_length=1, max_length=2_000_000)
    source_url: HttpUrl | None = Field(default=None, alias="sourceUrl")


def build_service(settings: Settings) -> AssistantService:
    return create_assistant_service(settings.deepseek_api_key, settings.deepseek_base_url)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    database = Database(
        settings.database_url,
        settings.database_pool_min_size,
        settings.database_pool_max_size,
        settings.database_command_timeout_seconds,
    )
    await database.connect()
    redis = Redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
    await redis.ping()
    repository = AssistantRepository(database)
    service = build_service(settings)
    for domain_id in service.domain_ids:
        domain = service.domain(domain_id)
        if domain is not None:
            await repository.ensure_domain(domain.id, domain.display_name)
    app.state.settings = settings
    app.state.database = database
    app.state.redis = redis
    app.state.repository = repository
    app.state.service = service
    app.state.retrieval = RetrievalService(
        repository, LlamaIndexEmbeddingClient(settings), settings.retrieval_limit
    )
    app.state.rate_limiter = RateLimiter(redis, settings.rate_limit_per_minute)
    app.state.queue = KnowledgeQueue(settings.broker_url)
    logger.info("assistant API started", extra={"domains": service.domain_ids})
    try:
        yield
    finally:
        await redis.aclose()
        await database.close()


app = FastAPI(title="Assistant Platform API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(get_settings().cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Visitor-ID", "X-Request-ID", "X-Admin-Key"],
)


@app.middleware("http")
async def request_observability(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    started_at = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        REQUEST_COUNT.labels(request.url.path, "500").inc()
        raise
    response.headers["X-Request-ID"] = request_id
    REQUEST_COUNT.labels(request.url.path, str(response.status_code)).inc()
    logger.info(
        "request_complete path=%s status=%s latency_ms=%d request_id=%s",
        request.url.path,
        response.status_code,
        (time.perf_counter() - started_at) * 1000,
        request_id,
    )
    return response


def _state(request: Request):
    return request.app.state


def _visitor_id(request: Request) -> str:
    supplied = (request.headers.get("X-Visitor-ID") or "").strip()
    if supplied:
        return supplied[:128]
    return request.client.host if request.client else "anonymous"


def _require_admin(request: Request, api_key: str | None = Header(default=None, alias="X-Admin-Key")) -> None:
    configured_key = _state(request).settings.admin_api_key
    if not configured_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Admin API is not configured.")
    if api_key != configured_key:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid admin API key.")


async def _check_rate_limit(request: Request) -> None:
    try:
        await _state(request).rate_limiter.check(_visitor_id(request))
    except RateLimitExceeded as exc:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "请求过于频繁，请稍后再试。",
            headers={"Retry-After": "60"},
        ) from exc


async def _chat(request: Request, payload: ChatRequest) -> dict[str, object]:
    state = _state(request)
    service: AssistantService = state.service
    assistant_id = (payload.assistant_id or service.default_domain_id).strip()
    if assistant_id not in service.domain_ids:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "指定的智能助手暂不可用。")

    repository: AssistantRepository = state.repository
    if payload.conversation_id is None:
        conversation_id = await repository.create_conversation(assistant_id, _visitor_id(request))
    else:
        conversation_id = payload.conversation_id
        if not await repository.conversation_exists(conversation_id, assistant_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "会话不存在或不属于当前助手。")

    history = await repository.history(conversation_id, state.settings.max_history_messages)
    await repository.add_message(conversation_id, "user", payload.query, {})
    started_at = time.perf_counter()
    knowledge_context, sources = await state.retrieval.retrieve(assistant_id, payload.query)
    context = AssistantContext(history=history, knowledge_context=knowledge_context, sources=sources)
    try:
        reply = await asyncio.to_thread(service.reply, payload.query, assistant_id, context)
    except UnknownAssistantDomainError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "指定的智能助手暂不可用。") from exc
    latency_ms = int((time.perf_counter() - started_at) * 1000)
    CHAT_LATENCY.observe(latency_ms / 1000)
    message_id = await repository.add_message(conversation_id, "assistant", reply.text, reply.metadata)
    try:
        await repository.record_model_call(assistant_id, conversation_id, latency_ms, "ok")
    except Exception:
        logger.exception("model audit persistence failed")
    return {
        "response": reply.text,
        "assistantId": assistant_id,
        "conversationId": str(conversation_id),
        "messageId": message_id,
        "intent": reply.metadata.get("intent", ""),
        "term": reply.metadata.get("term", ""),
        "sources": reply.metadata.get("sources", []),
    }


@app.post("/api/agent")
async def chat(request: Request, payload: ChatRequest):
    await _check_rate_limit(request)
    return await _chat(request, payload)


@app.post("/api/agent/stream")
async def chat_stream(request: Request, payload: ChatRequest):
    await _check_rate_limit(request)

    async def events() -> AsyncIterator[str]:
        yield "event: status\ndata: {\"status\":\"processing\"}\n\n"
        try:
            result = await _chat(request, payload)
            yield f"event: message\ndata: {json.dumps(result, ensure_ascii=False)}\n\n"
        except HTTPException as exc:
            yield f"event: error\ndata: {json.dumps({'detail': exc.detail}, ensure_ascii=False)}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@app.post("/api/agent/messages/{message_id}/feedback", status_code=status.HTTP_204_NO_CONTENT)
async def feedback(message_id: int, payload: FeedbackRequest, request: Request):
    await _state(request).repository.add_feedback(message_id, payload.rating, payload.comment)
    return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)


@app.post("/api/knowledge/documents", status_code=status.HTTP_202_ACCEPTED)
async def create_document(request: Request, payload: KnowledgeDocumentRequest, x_admin_key: str | None = Header(default=None)):
    _require_admin(request, x_admin_key)
    service: AssistantService = _state(request).service
    if payload.assistant_id not in service.domain_ids:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "指定的智能助手暂不可用。")
    document_id = await _state(request).repository.create_document(
        payload.assistant_id, payload.title, payload.content, str(payload.source_url) if payload.source_url else None
    )
    task_id = _state(request).queue.enqueue_ingestion(document_id)
    return {"documentId": str(document_id), "taskId": task_id, "status": "queued"}


@app.get("/api/knowledge/documents/{document_id}")
async def document_status(document_id: UUID, request: Request, x_admin_key: str | None = Header(default=None)):
    _require_admin(request, x_admin_key)
    document = await _state(request).repository.document(document_id)
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "知识文档不存在。")
    return {
        "id": str(document["id"]),
        "assistantId": document["assistant_id"],
        "title": document["title"],
        "sourceUrl": document["source_url"],
        "status": document["status"],
        "chunkCount": document["chunk_count"],
        "errorMessage": document["error_message"],
        "createdAt": document["created_at"],
        "updatedAt": document["updated_at"],
    }


@app.get("/health")
async def health(request: Request):
    state = _state(request)
    db_ok = await state.database.healthy()
    try:
        redis_ok = bool(await state.redis.ping())
    except Exception:
        redis_ok = False
    response = {"ok": db_ok and redis_ok, "database": db_ok, "redis": redis_ok, "assistants": state.service.domain_ids}
    return JSONResponse(response, status_code=200 if response["ok"] else 503)


@app.get("/metrics")
async def metrics():
    return PlainTextResponse(generate_latest().decode("utf-8"), media_type=CONTENT_TYPE_LATEST)
