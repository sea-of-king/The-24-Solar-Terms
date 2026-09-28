"""Application composition root for the currently enabled assistant domains."""

from __future__ import annotations

import os

from assistant_core.registry import DomainRegistry
from assistant_core.service import AssistantService
from domains.solar_terms import SolarTermsDomain
from solar_term_agent import SolarTermAgent


DEFAULT_ASSISTANT_ID = "solar-terms"


def create_assistant_service(api_key: str | None, base_url: str) -> AssistantService:
    """Build the enabled domains without coupling them to HTTP handlers."""
    solar_terms = SolarTermsDomain(SolarTermAgent(api_key=api_key, base_url=base_url))
    registry = DomainRegistry([solar_terms])
    default_domain_id = os.environ.get(
        "DEFAULT_ASSISTANT_ID", DEFAULT_ASSISTANT_ID
    ).strip() or DEFAULT_ASSISTANT_ID
    return AssistantService(registry, default_domain_id)
