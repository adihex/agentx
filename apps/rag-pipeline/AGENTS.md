# AI Engineering RAG — Agent Notes

## What this repo is

A local learning/tutorial RAG pipeline grounded on a curated **NotebookLM** notebook about AI Engineering. It demonstrates document chunking, dense embeddings, BM25 keyword search, hybrid search with Reciprocal Rank Fusion (RRF), and grounded answer generation via Gemini.

## Essential commands

- Set API key: copy `.env.example` to `.env` and add `GEMINI_API_KEY`.
- Install deps: `pip install -e .` (uses `pyproject.toml`).
- Download sources: `python3 scripts/download_sources.py` (requires `nlm` CLI at `~/.local/bin/nlm`).
- Index: `python3 main.py --index`
- Query interactively: `python3 main.py`
- Single query: `python3 main.py --query "..." --top-n 5`

## Data flow

1. `scripts/download_sources.py` fetches `.txt` files from NotebookLM notebook `ead71b1a-0aef-4fa8-9a84-5c599aa6ab73` into `data/sources/`.
2. `rag/pipeline.py` chunks sources and indexes them into a local **ChromaDB** at `data/chroma`, collection `ai_engineering`.
3. Retrieval runs vector search (ChromaDB, cosine space) + BM25 over the same chunks, then fuses ranks with RRF (`k=60`, default `vector_weight=0.5`).
4. Generation calls `gemini-2.5-flash` with a strict grounding/citation system prompt.

## Key implementation details

- Uses the **new `google-genai` SDK** (`from google import genai`), not the legacy `google-generativeai`.
- Embeddings: `gemini-embedding-001`, batched 50 at a time (`GeminiEmbedder`).
- Chunking: character-based, default `chunk_size=1200`, `chunk_overlap=300`, splits at sentence boundaries within the overlap zone; skips chunks under 40 chars.
- Indexing **deletes and recreates** the `ai_engineering` collection each run to avoid duplication.
- BM25 is rebuilt from ChromaDB after indexing and on every `initialize()`.
- `main.py` exits early if `GEMINI_API_KEY` is missing.

## File map

- `main.py` — CLI entry point (`--index`, `--query`, interactive loop).
- `rag/pipeline.py` — `RAGPipeline`: initialize, index, retrieve, generate.
- `rag_tutorial.ipynb` — Jupyter notebook version of the same pipeline.
- `scripts/download_sources.py` — NotebookLM source downloader.
- `scripts/create_notebook.py` — regenerates `rag_tutorial.ipynb` from code templates.
- `data/sources/` — raw `.txt` sources; `data/chroma/` — persisted ChromaDB (do not commit).

## Conventions

- Python ≥3.10.
- Source filenames are sanitized from NotebookLM titles; duplicates are skipped if already present and non-empty.
- `.env` is required at repo root; do not commit secrets.
