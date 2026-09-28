"""LlamaIndex ingestion splitter shared by knowledge ingestion workers."""

from __future__ import annotations

from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import Document


def chunk_text(text: str, chunk_size: int = 900, overlap: int = 120) -> list[str]:
    """Split normalized content with LlamaIndex's token-aware sentence splitter."""
    normalized = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    if not normalized:
        return []
    pipeline = IngestionPipeline(
        transformations=[SentenceSplitter(chunk_size=chunk_size, chunk_overlap=overlap)]
    )
    nodes = pipeline.run(documents=[Document(text=normalized)])
    return [node.get_content().strip() for node in nodes if node.get_content().strip()]
