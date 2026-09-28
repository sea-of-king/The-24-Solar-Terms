"""Adapter exposing the existing solar-term knowledge as a reusable domain."""

from __future__ import annotations

from assistant_core.contracts import AssistantContext, AssistantReply
from solar_term_agent import SolarTermAgent


class SolarTermsDomain:
    """Keep the legacy knowledge implementation behind the domain contract."""

    id = "solar-terms"
    display_name = "二十四节气助手"

    def __init__(self, agent: SolarTermAgent) -> None:
        self._agent = agent

    def reply(
        self, query: str, context: AssistantContext | None = None
    ) -> AssistantReply:
        knowledge_context = context.knowledge_context if context else ""
        history = context.history if context else ()
        return AssistantReply(
            text=self._agent.process_with_context(query, knowledge_context, history),
            metadata={
                "intent": self._agent.classify_intent(query),
                "term": self._agent.extract_term(query) or "",
                "sources": list(context.sources) if context else [],
            },
        )
