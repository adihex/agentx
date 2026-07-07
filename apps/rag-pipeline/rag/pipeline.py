"""Hybrid RAG pipeline (ChromaDB vector search + BM25, fused with RRF).

Extracted from rag_tutorial.ipynb into an importable module for main.py.
"""

import re
from pathlib import Path
from typing import Any

import chromadb
import numpy as np
from chromadb import EmbeddingFunction
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection
from chromadb.api.types import Metadata
from google import genai
from google.genai import types
from rank_bm25 import BM25Okapi

CHROMA_PATH = "data/chroma"
COLLECTION_NAME = "ai_engineering"
GENERATION_MODEL = "gemini-2.5-flash"

SYSTEM_INSTRUCTION = (
    "You are an expert AI engineering assistant. "
    "Your task is to answer the user's question using only the provided context. "
    "Always follow these rules:\n"
    "1. Ground your answers strictly in the provided context. Do not make up facts.\n"
    "2. If the context does not contain the answer, state that you do not have enough "
    "information to answer.\n"
    "3. Cite your sources inline using [Source X] format matching the corresponding "
    "context labels (e.g., [Source 1], [Source 2])."
)


def split_text(text: str, chunk_size: int = 1200, chunk_overlap: int = 300) -> list[str]:
    """Splits document text into overlapping chunks with sentence boundary awareness"""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))

        # Find a clean boundary (newline or period) in the overlap zone to split
        if end < len(text):
            boundary = -1
            for i in range(end, max(start, end - chunk_overlap), -1):
                if text[i - 1] in {".", "!", "?", "\n"}:
                    boundary = i
                    break
            if boundary != -1:
                end = boundary

        chunk = text[start:end].strip()
        if len(chunk) > 40:  # skip tiny chunks
            chunks.append(chunk)

        start = end - chunk_overlap
        if start >= len(text) or end == len(text):
            break
    return chunks


def tokenize(text: str) -> list[str]:
    return re.findall(r"\b\w+\b", text.lower())


class GeminiEmbedder(EmbeddingFunction):
    def __init__(self, client: genai.Client, model: str = "gemini-embedding-001"):
        self.client = client
        self.model = model

    def __call__(self, input):
        embeddings = []
        # Batch requests of 50 to avoid API rate limits
        batch_size = 50
        for i in range(0, len(input), batch_size):
            batch = input[i : i + batch_size]
            response = self.client.models.embed_content(model=self.model, contents=batch)
            embeddings.extend([e.values for e in response.embeddings or []])
        return embeddings


class RAGPipeline:
    def __init__(self, chroma_path: str = CHROMA_PATH, collection_name: str = COLLECTION_NAME):
        self.chroma_path = chroma_path
        self.collection_name = collection_name
        self.client: genai.Client | None = None
        self.embedder: GeminiEmbedder | None = None
        self.chroma_client: ClientAPI | None = None
        self.collection: Collection | None = None
        self.bm25: BM25Okapi | None = None
        self.bm25_chunks: list[dict[str, Any]] = []

    def initialize(self) -> None:
        """Connect to Gemini and ChromaDB, and build the BM25 index if documents exist."""
        self.client = genai.Client()
        self.embedder = GeminiEmbedder(self.client)
        self.chroma_client = chromadb.PersistentClient(path=self.chroma_path)
        self.collection = self.chroma_client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.embedder,
            metadata={"hnsw:space": "cosine"},
        )
        if self.collection.count() > 0:
            self._build_bm25()

    def _require_collection(self) -> Collection:
        collection = self.collection
        assert collection is not None, "RAGPipeline is not initialized — call initialize() first"
        return collection

    def _build_bm25(self) -> None:
        results = self._require_collection().get(include=["documents", "metadatas"])
        self.bm25_chunks = []
        tokenized_corpus = []
        for doc, meta in zip(results["documents"] or [], results["metadatas"] or []):
            self.bm25_chunks.append({"content": doc, "metadata": meta})
            tokenized_corpus.append(tokenize(doc))
        self.bm25 = BM25Okapi(tokenized_corpus) if tokenized_corpus else None

    def index_documents(self, sources_dir: str) -> None:
        """Chunk every .txt file in sources_dir and (re)index into ChromaDB + BM25."""
        chroma_client = self.chroma_client
        assert chroma_client is not None, (
            "RAGPipeline is not initialized — call initialize() first"
        )

        sources_path = Path(sources_dir)
        txt_files = sorted(sources_path.glob("*.txt"))
        if not txt_files:
            print(f"No .txt files found in '{sources_dir}'. Nothing to index.")
            return

        all_chunks: list[str] = []
        all_metadatas: list[Metadata] = []
        all_ids: list[str] = []

        print(f"Processing {len(txt_files)} documents...")
        for file_path in txt_files:
            title = file_path.stem
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            chunks = split_text(content)
            for idx, chunk_content in enumerate(chunks):
                all_chunks.append(chunk_content)
                all_metadatas.append(
                    {
                        "source_title": title,
                        "chunk_index": idx,
                        "file_path": str(file_path),
                    }
                )
                all_ids.append(f"{title}_chunk_{idx}")

        print(f"Total chunks generated: {len(all_chunks)}")

        # Clear existing items before indexing to avoid duplication
        try:
            chroma_client.delete_collection(self.collection_name)
        except Exception:
            pass
        self.collection = chroma_client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.embedder,
            metadata={"hnsw:space": "cosine"},
        )

        batch_size = 100
        for i in range(0, len(all_ids), batch_size):
            print(f"Indexing batch {i // batch_size + 1}...")
            self.collection.add(
                documents=all_chunks[i : i + batch_size],
                metadatas=all_metadatas[i : i + batch_size],
                ids=all_ids[i : i + batch_size],
            )
        print(f"ChromaDB indexing complete. Total docs in DB: {self.collection.count()}")

        self._build_bm25()

    def _retrieve_vector(self, query: str, top_n: int = 10) -> list[dict[str, Any]]:
        results = self._require_collection().query(
            query_texts=[query],
            n_results=top_n,
            include=["documents", "metadatas", "distances"],
        )
        vector_results = []
        documents = results["documents"] or [[]]
        metadatas = results["metadatas"] or [[]]
        distances = results["distances"] or [[]]
        for doc, meta, dist in zip(documents[0], metadatas[0], distances[0]):
            vector_results.append({"content": doc, "metadata": meta, "score": 1.0 - dist})
        return vector_results

    def _retrieve_bm25(self, query: str, top_n: int = 10) -> list[dict[str, Any]]:
        if self.bm25 is None:
            return []
        scores = self.bm25.get_scores(tokenize(query))
        top_indices = np.argsort(scores)[::-1][:top_n]
        bm25_results = []
        for idx in top_indices:
            if scores[idx] > 0:
                bm25_results.append(
                    {
                        "content": self.bm25_chunks[idx]["content"],
                        "metadata": self.bm25_chunks[idx]["metadata"],
                        "score": float(scores[idx]),
                    }
                )
        return bm25_results

    def retrieve(
        self, query: str, top_n: int = 5, vector_weight: float = 0.5
    ) -> list[dict[str, Any]]:
        """Hybrid retrieval: vector + BM25 fused with Reciprocal Rank Fusion."""
        if self.collection is None or self.collection.count() == 0:
            return []

        candidate_count = max(20, top_n * 3)
        vector_results = self._retrieve_vector(query, top_n=candidate_count)
        bm25_results = self._retrieve_bm25(query, top_n=candidate_count)

        k = 60
        rrf_scores: dict[str, float] = {}
        metadata_map: dict[str, Any] = {}

        for rank, res in enumerate(vector_results):
            c = res["content"]
            metadata_map[c] = res["metadata"]
            rrf_scores[c] = rrf_scores.get(c, 0.0) + (vector_weight / (k + rank + 1))

        for rank, res in enumerate(bm25_results):
            c = res["content"]
            metadata_map[c] = res["metadata"]
            rrf_scores[c] = rrf_scores.get(c, 0.0) + ((1.0 - vector_weight) / (k + rank + 1))

        sorted_candidates = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

        retrieved = []
        for content, score in sorted_candidates[:top_n]:
            retrieved.append(
                {"content": content, "metadata": metadata_map[content], "rrf_score": score}
            )
        return retrieved

    def generate(self, query: str, chunks: list[dict[str, Any]]) -> str:
        """Generate a grounded answer for the query from the retrieved chunks."""
        client = self.client
        assert client is not None, "RAGPipeline is not initialized — call initialize() first"

        context_parts = []
        for idx, chunk in enumerate(chunks):
            source = chunk["metadata"]["source_title"]
            context_parts.append(f"[Source {idx + 1}: {source}]\n{chunk['content']}\n")
        context_str = "\n".join(context_parts)

        prompt = (
            f"Context from curated AI Engineering documents:\n"
            f"-----------------------------------------\n"
            f"{context_str}\n"
            f"-----------------------------------------\n"
            f"User Question: {query}\n"
            f"Answer:"
        )

        response = client.models.generate_content(
            model=GENERATION_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.2,
            ),
        )
        return response.text or ""
