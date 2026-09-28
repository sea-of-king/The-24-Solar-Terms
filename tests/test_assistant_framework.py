"""Regression tests for the reusable assistant domain boundary."""

from __future__ import annotations

import unittest

from assistant_core.contracts import AssistantReply
from assistant_core.registry import DomainRegistry
from assistant_core.service import AssistantService, UnknownAssistantDomainError
from domains.solar_terms import SolarTermsDomain
from solar_term_agent import SolarTermAgent


class EchoDomain:
    id = "echo"
    display_name = "Echo"

    def reply(self, query: str, context=None) -> AssistantReply:
        return AssistantReply(query.upper(), {"source": "test"})


class AssistantFrameworkTests(unittest.TestCase):
    def test_service_selects_default_domain_and_adds_its_id(self) -> None:
        service = AssistantService(DomainRegistry([EchoDomain()]), "echo")

        reply = service.reply("hello")

        self.assertEqual(reply.text, "HELLO")
        self.assertEqual(reply.metadata, {"assistantId": "echo", "source": "test"})

    def test_service_rejects_unknown_domain(self) -> None:
        service = AssistantService(DomainRegistry([EchoDomain()]), "echo")

        with self.assertRaises(UnknownAssistantDomainError):
            service.reply("hello", "missing")

    def test_solar_terms_domain_preserves_existing_answering(self) -> None:
        domain = SolarTermsDomain(SolarTermAgent())

        reply = domain.reply("立春有什么习俗？")

        self.assertIn("迎春", reply.text)
        self.assertEqual(reply.metadata["intent"], "basic_info")
        self.assertEqual(reply.metadata["term"], "lichun")


if __name__ == "__main__":
    unittest.main()
