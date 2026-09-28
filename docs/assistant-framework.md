# Assistant Framework

The assistant HTTP service is domain-neutral. It owns transport, session
history, retrieval context, and domain selection; each domain owns its
knowledge, routing, prompts, and response metadata.

## Current layout

```text
assistant_core/       Shared contracts, registry, and service facade
domains/solar_terms/  The current solar-term domain adapter
assistant_factory.py  Enabled domains and default domain composition
app/                   FastAPI transport, persistence, LlamaIndex RAG, and rate limiting
worker/                Celery + LlamaIndex knowledge-ingestion worker
agent_server.py        Compatibility launcher for the FastAPI application
```

`POST /api/agent` accepts the existing request shape and defaults to the
configured assistant:

```json
{"query": "立春有什么习俗？"}
```

Clients that need a particular assistant may send `assistantId`:

```json
{"assistantId": "solar-terms", "query": "立春有什么习俗？"}
```

Every successful response includes `assistantId`. Unknown IDs return
`404 assistant_not_found`; no fallback is made because selecting the wrong
knowledge domain is unsafe.

## Adding a domain

Create `domains/<domain_id>/domain.py` with an object satisfying
`AssistantDomain`:

```python
from assistant_core.contracts import AssistantReply


class ProductSupportDomain:
    id = "product-support"
    display_name = "产品支持助手"

    def reply(self, query: str, context=None) -> AssistantReply:
        return AssistantReply(
            text="...",
            metadata={"intent": "support"},
        )
```

Import and register it in `assistant_factory.py`. Domain IDs are stable public
API identifiers: use lowercase kebab-case and do not repurpose an existing ID.

## Configuration

`DEFAULT_ASSISTANT_ID` selects the domain for clients that do not send
`assistantId`. It must match a domain registered by `assistant_factory.py`.

The current solar-term implementation remains a deterministic local knowledge
adapter with optional model enhancement. Every domain receives prior chat turns
and retrieved knowledge through `AssistantContext`; future RAG domains use the
same `reply()` contract while their ingestion and retrieval remain behind the
domain boundary.

## RAG implementation

LlamaIndex provides the RAG orchestration layer: `IngestionPipeline` and
`SentenceSplitter` produce token-aware chunks, while `OpenAILikeEmbedding`
connects to an OpenAI-compatible embedding provider. PostgreSQL remains the
business source of truth for documents, chunk audit metadata, domain isolation,
and pgvector similarity search. When no embedding provider is configured, the
same API falls back to lexical retrieval instead of failing chat requests.
