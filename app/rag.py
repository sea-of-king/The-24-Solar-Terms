"""LlamaIndex-powered RAG embedding and retrieval facade."""

from __future__ import annotations

from typing import Any
from llama_index.embeddings.openai_like import OpenAILikeEmbedding

from .config import Settings
from .repository import AssistantRepository


class EmbeddingProviderError(RuntimeError):
    """Normalizes provider failures for fallback and Celery retry policies."""


class LlamaIndexEmbeddingClient:
    """OpenAI-compatible embeddings behind LlamaIndex's provider abstraction."""

    def __init__(self, settings: Settings) -> None:
        self._dimensions = settings.embedding_dimensions
        self._embedder: OpenAILikeEmbedding | None = None
        if settings.embedding_api_key and settings.embedding_base_url:
            self._embedder = OpenAILikeEmbedding(
                model_name=settings.embedding_model,
                api_key=settings.embedding_api_key,
                api_base=settings.embedding_base_url.rstrip("/"),
                dimensions=settings.embedding_dimensions,
                timeout=30,
            )

    async def embed_query(self, text: str) -> list[float] | None:
        if self._embedder is None:
            return None
        return self._validate(await self._call_async(text))

    def embed_text(self, text: str) -> list[float] | None:
        if self._embedder is None:
            return None
        try:
            return self._validate(self._embedder.get_text_embedding(text))
        except Exception as exc:
            raise EmbeddingProviderError("LlamaIndex embedding request failed.") from exc

    async def _call_async(self, text: str) -> list[float]:
        assert self._embedder is not None
        try:
            return await self._embedder.aget_query_embedding(text)
        except Exception as exc:
            raise EmbeddingProviderError("LlamaIndex embedding request failed.") from exc

    def _validate(self, vector: list[float]) -> list[float]:
        if len(vector) != self._dimensions:
            raise EmbeddingProviderError(
                "Embedding dimension does not match database configuration."
            )
        return [float(value) for value in vector]


class RetrievalService:
    def __init__(self, repository: AssistantRepository, embeddings: LlamaIndexEmbeddingClient, limit: int) -> None:
        self._repository = repository
        self._embeddings = embeddings
        self._limit = limit

    async def retrieve(self, assistant_id: str, query: str) -> tuple[str, list[dict[str, Any]]]:
        try:
            embedding = await self._embeddings.embed_query(query)
        except EmbeddingProviderError:
            embedding = None
        if embedding is not None:
            records = await self._repository.vector_search(assistant_id, embedding, self._limit)
        else:
            records = await self._repository.lexical_search(assistant_id, query, self._limit)
        sources = [
            {
                "chunkId": record["id"],
                "title": record["title"],
                "sourceUrl": record["source_url"],
                "score": round(float(record["score"]), 4),
            }
            for record in records
        ]
        context = "\n\n".join(
            f"【{record['title']}】\n{record['content']}" for record in records
        )
        return context, sources
