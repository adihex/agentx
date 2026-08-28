"""Pure Python RAG foundation utilities."""

from .core import reciprocal_rank_fusion, split_text
from .local_index import Document, LocalDocumentIndex
from .pipeline import (
    INSUFFICIENT_INFORMATION,
    Citation,
    Generator,
    RAGPipeline,
    RAGResult,
    RetrievalHit,
    Retriever,
)

__all__ = [
    "INSUFFICIENT_INFORMATION",
    "Citation",
    "Document",
    "Generator",
    "LocalDocumentIndex",
    "RAGPipeline",
    "RAGResult",
    "RetrievalHit",
    "Retriever",
    "reciprocal_rank_fusion",
    "split_text",
]
