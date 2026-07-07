# @agentx/zettel-import — Design Document

**Date:** 2026-07-05

## Goal

A standalone TypeScript CLI (`npx @agentx/zettel-import <NOTEBOOK_ID>`) that pulls all sources from a NotebookLM notebook via the `nlm` CLI, creates Zettel notes (with GraphRAG entity extraction) in the remote Turso DB, and indexes the sources into the local RAG pipeline (ChromaDB).

## Architecture

```
nlm source list <NOTEBOOK_ID>
       │
       ▼  (per source)
nlm source content <SOURCE_ID>
       │
       ├──► writeNote() → LibSQL/Turso DB
       │         └──► extractGraph() → entities + entity_relations tables
       │
       └──► Save to rag-pipeline/data/sources/
                 └──► python3 main.py --index (ChromaDB)
```

## CLI Interface

```sh
npx @agentx/zettel-import <NOTEBOOK_ID> \
  --db-url <turso-url>    # or TURSO_DATABASE_URL env var
  --db-token <token>      # or TURSO_AUTH_TOKEN env var
  --user-id <user-id>     # required: which user owns the created notes
  --nlm-path <path>       # default: ~/.local/bin/nlm
  --rag-dir <path>        # default: apps/rag-pipeline relative to monorepo root
  --skip-rag              # skip ChromaDB indexing step
```

## UI — OpenTUI Live Dashboard

Uses `@opentui/react` + `@opentui/core`. Renders a live table with a row per source and columns for each pipeline stage.

## Package Location

`apps/zettel-import/` — mirrors the pattern of other apps in the monorepo.
