"""Provider-independent orchestration for retrieval-augmented generation."""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Protocol

from .core import reciprocal_rank_fusion

INSUFFICIENT_INFORMATION = "Insufficient information in the retrieved sources."


@dataclass(frozen=True)
class RetrievalHit:
    """A retriever result with an identity shared across retrieval methods."""

    document_id: str
    text: str
    metadata: Mapping[str, object] = field(default_factory=dict)


class Retriever(Protocol):
    def __call__(self, query: str, limit: int) -> Sequence[RetrievalHit]: ...


class Generator(Protocol):
    def __call__(self, question: str, context: str) -> str: ...


@dataclass(frozen=True)
class Citation:
    label: str
    document_id: str
    metadata: Mapping[str, object]


@dataclass(frozen=True)
class RAGResult:
    answer: str
    context: str
    citations: tuple[Citation, ...]
    insufficient_information: bool = False


class RAGPipeline:
    """Fuse dense and lexical retrieval before invoking an injected generator."""

    def __init__(
        self,
        dense_retriever: Retriever,
        lexical_retriever: Retriever,
        generator: Generator,
        *,
        retrieval_limit: int = 5,
    ) -> None:
        if retrieval_limit <= 0:
            raise ValueError("retrieval_limit must be positive")
        self._dense_retriever = dense_retriever
        self._lexical_retriever = lexical_retriever
        self._generator = generator
        self._retrieval_limit = retrieval_limit

    def run(self, question: str) -> RAGResult:
        rankings = [
            self._dense_retriever(question, self._retrieval_limit),
            self._lexical_retriever(question, self._retrieval_limit),
        ]
        hits_by_id: dict[str, RetrievalHit] = {}
        id_rankings: list[list[str]] = []
        for ranking in rankings:
            ids: list[str] = []
            for hit in ranking:
                hits_by_id.setdefault(hit.document_id, hit)
                ids.append(hit.document_id)
            id_rankings.append(ids)

        fused = reciprocal_rank_fusion(id_rankings, limit=self._retrieval_limit)
        if not fused:
            return RAGResult(INSUFFICIENT_INFORMATION, "", (), True)

        context_parts: list[str] = []
        citations: list[Citation] = []
        for index, (document_id, _score) in enumerate(fused, start=1):
            hit = hits_by_id[document_id]
            label = f"SOURCE_{index}"
            context_parts.append(f"[{label}]\n{hit.text}")
            citations.append(Citation(label, document_id, dict(hit.metadata)))

        context = "\n\n".join(context_parts)
        return RAGResult(self._generator(question, context), context, tuple(citations))
