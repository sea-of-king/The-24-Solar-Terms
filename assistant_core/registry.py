"""In-memory registry for enabled assistant domains."""

from __future__ import annotations

from .contracts import AssistantDomain


class DomainRegistry:
    """Keep domain selection explicit and fail fast on duplicate IDs."""

    def __init__(self, domains: list[AssistantDomain] | None = None) -> None:
        self._domains: dict[str, AssistantDomain] = {}
        for domain in domains or []:
            self.register(domain)

    def register(self, domain: AssistantDomain) -> None:
        domain_id = domain.id.strip()
        if not domain_id:
            raise ValueError("Assistant domain ID cannot be empty.")
        if domain_id in self._domains:
            raise ValueError(f"Assistant domain is already registered: {domain_id}")
        self._domains[domain_id] = domain

    def get(self, domain_id: str) -> AssistantDomain | None:
        return self._domains.get(domain_id)

    def ids(self) -> tuple[str, ...]:
        return tuple(self._domains)
