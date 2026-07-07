# @agentx/zettel-import

Standalone CLI that imports a NotebookLM notebook into the Zettelkasten.

For every source in the notebook it:

1. Fetches the raw content via the [`nlm` CLI](https://github.com/jacob-bd/notebooklm-mcp-cli)
2. Creates a Zettel note in the Turso/libsql DB (with embedding + GraphRAG
   entity extraction, identical semantics to the zettel app's `writeNote()`)
3. Saves the content into `apps/rag-pipeline/data/sources/` and runs
   `main.py --index` once at the end to index everything into ChromaDB

Progress is shown in a live OpenTUI dashboard with a row per source and a
column per pipeline stage.

## Usage

```sh
npx @agentx/zettel-import <NOTEBOOK_ID> \
  --user-id <user-id> \
  --db-url <turso-url> \      # or TURSO_DATABASE_URL
  --db-token <token>          # or TURSO_AUTH_TOKEN
```

From inside the monorepo:

```sh
pnpm --filter @agentx/zettel-import start -- <NOTEBOOK_ID> --user-id <user-id>
```

Requires the [Bun](https://bun.sh) runtime (already in the repo's `mise.toml`):
`@opentui/core`'s native renderer does not support Node, matching the other
OpenTUI CLIs in this repo.

### Options

| Flag         | Default              | Description                     |
| ------------ | -------------------- | ------------------------------- |
| `--db-url`   | `TURSO_DATABASE_URL` | Turso/libsql database URL       |
| `--db-token` | `TURSO_AUTH_TOKEN`   | Turso auth token                |
| `--user-id`  | (required)           | Owner of the created notes      |
| `--nlm-path` | `~/.local/bin/nlm`   | Path to the `nlm` CLI           |
| `--rag-dir`  | `apps/rag-pipeline`  | RAG pipeline directory          |
| `--skip-rag` | off                  | Skip the ChromaDB indexing step |

### Environment

- `GEMINI_API_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY`) — required for entity
  extraction (`gemini-2.5-flash`), note embeddings (`text-embedding-004`),
  and the RAG indexing step.
- The `nlm` CLI must be authenticated (`nlm login`).

## Notes

- Imported notes are tagged `notebooklm-import`.
- The note store mirrors `apps/zettel/src/notes/store.ts` (schema, ID
  generation, insert semantics). If that file changes, keep
  `src/store.ts` here in sync.
