"""Deterministic in-memory document chunking and lexical retrieval."""

import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field

from .core import split_text
from .pipeline import RetrievalHit


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"\b\w+\b", text.casefold()))


@dataclass(frozen=True)
class Document:
    document_id: str
    text: str
    metadata: Mapping[str, object] = field(default_factory=dict)


class LocalDocumentIndex:
    """A rebuildable lexical index compatible with ``RAGPipeline`` retrievers."""

    def __init__(
        self,
        *,
        chunk_size: int = 1200,
        chunk_overlap: int = 300,
        min_chunk_chars: int = 40,
    ) -> None:
        self._chunk_options = {
            "chunk_size": chunk_size,
            "chunk_overlap": chunk_overlap,
            "min_chunk_chars": min_chunk_chars,
        }
        self._chunks: list[tuple[RetrievalHit, set[str]]] = []

    def rebuild(self, documents: Iterable[Document]) -> None:
        """Replace the complete index with caller-supplied documents."""
        rebuilt: list[tuple[RetrievalHit, set[str]]] = []
        seen: set[str] = set()
        for document in documents:
            if document.document_id in seen:
                raise ValueError(f"duplicate document id: {document.document_id}")
            seen.add(document.document_id)
            metadata = dict(document.metadata)
            metadata["document_id"] = document.document_id
            for index, chunk in enumerate(split_text(document.text, **self._chunk_options)):
                chunk_id = f"{len(document.document_id)}:{document.document_id}:{index}"
                rebuilt.append((RetrievalHit(chunk_id, chunk, metadata), _tokens(chunk)))
        self._chunks = rebuilt

    def __call__(self, query: str, limit: int) -> list[RetrievalHit]:
        if limit <= 0:
            return []
        query_tokens = _tokens(query)
        if not query_tokens:
            return []
        ranked = [
            (len(query_tokens & tokens), hit)
            for hit, tokens in self._chunks
            if query_tokens & tokens
        ]
        ranked.sort(key=lambda item: (-item[0], item[1].document_id))
        return [hit for _score, hit in ranked[:limit]]
