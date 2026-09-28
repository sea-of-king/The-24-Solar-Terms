"""Transport-neutral entry point for a multi-domain assistant service."""

from __future__ import annotations

from .contracts import AssistantContext, AssistantReply
from .registry import DomainRegistry


class UnknownAssistantDomainError(ValueError):
    """Raised when a caller requests an assistant that is not enabled."""


class AssistantService:
    """Resolve a domain and normalize its response metadata."""

    def __init__(self, registry: DomainRegistry, default_domain_id: str) -> None:
        if registry.get(default_domain_id) is None:
            raise ValueError(f"Default assistant is not registered: {default_domain_id}")
        self._registry = registry
        self.default_domain_id = default_domain_id

    @property
    def domain_ids(self) -> tuple[str, ...]:
        return self._registry.ids()

    def domain(self, domain_id: str):
        """Return a registered domain for application composition only."""
        return self._registry.get(domain_id)

    def reply(
        self,
        query: str,
        domain_id: str | None = None,
        context: AssistantContext | None = None,
    ) -> AssistantReply:
        selected_id = (domain_id or self.default_domain_id).strip()
        domain = self._registry.get(selected_id)
        if domain is None:
            raise UnknownAssistantDomainError(selected_id)

        reply = domain.reply(query, context)
        metadata = {"assistantId": selected_id, **reply.metadata}
        return AssistantReply(text=reply.text, metadata=metadata)
