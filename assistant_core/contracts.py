"""Contracts that separate the assistant runtime from domain knowledge."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, Sequence


@dataclass(frozen=True)
class AssistantReply:
    """A domain answer plus safe, client-facing metadata."""

    text: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ChatTurn:
    """A persisted message made available to a domain at answer time."""

    role: str
    content: str


@dataclass(frozen=True)
class AssistantContext:
    """Optional conversation and retrieval context for one answer."""

    history: Sequence[ChatTurn] = ()
    knowledge_context: str = ""
    sources: Sequence[dict[str, Any]] = ()


class AssistantDomain(Protocol):
    """A pluggable domain implementation for one assistant product."""

    id: str
    display_name: str

    def reply(
        self, query: str, context: AssistantContext | None = None
    ) -> AssistantReply:
        """Answer one user query without depending on HTTP transport."""
