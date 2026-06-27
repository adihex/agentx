<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# music-scanner-service

## Purpose

A standalone runtime host that consumes `@agentx/core` as a library to power an LLM-driven music extraction workflow. It does not implement the agent loop itself; instead it constructs an `AgentEventLoop` (configured with `adpPort: 9222`, a music-extraction system prompt, and three injected tools), registers a custom ADP command handler `Music.StartExtraction`, and then stays alive listening for ADP commands. When a command arrives, the handler drives the agent through the search → download/upload → Cloud Run extraction pipeline and streams status notifications back over ADP. This is the deployable process operators run; the `@agentx/core` package is the reusable engine behind it.

## Key Files

| File                    | Description                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`          | Entry point. Loads `.env` via dotenv, defines the `SYSTEM_PROMPT`, instantiates `AgentEventLoop({ adpPort: 9222, systemPrompt, tools })` with the three injected tools, registers the `Music.StartExtraction` ADP handler that calls `agent.run(...)`, logs startup, and keeps the process alive (graceful `agent.shutdown()` on SIGINT). |
| `src/tools/search.ts`   | Exports `searchMusic` — a stringified async tool (injected into a thread-pool worker) that shells out to `yt-dlp ytsearch3` for a query and returns the top matches plus a `bestMatch`. Takes `{ query: string }`.                                                                                                                        |
| `src/tools/download.ts` | Exports `downloadAndUpload` — a stringified async tool that downloads a YouTube video as MP3 via `yt-dlp`, uploads it to GCS with `gcloud storage cp`, and cleans up the local temp file. Takes `{ id: string, bucket: string }`; returns `gcsPath` and `fileName`.                                                                       |
| `src/tools/cloudrun.ts` | Exports `triggerCloudRun` — a stringified async tool that runs `gcloud run jobs execute` against the `guitar-processor` job (defaults: project `guitar-extractor`, region `us-central1`), overriding `INPUT_FILE_NAME`. Takes `{ fileName: string, project?, region?, jobName? }`.                                                        |
| `ui/`                   | Static front-end assets (`index.html`, `app.js`, `style.css`) for a simple operator/demo UI. Not part of the service runtime — mentioned for completeness.                                                                                                                                                                                |

## For AI Agents

### Working In This Directory

**How to run:**

1. `cd apps/music-scanner-service`.
2. Create a `.env` file with the LLM configuration consumed by `@agentx/core`:
   - `OPENAI_API_KEY` — API key for the LLM provider.
   - `OPENAI_BASE_URL` — must be an **API root** (e.g. `https://opencode.ai/zen/go/v1`), **not** a full `/chat/completions` endpoint. The core client appends the path itself.
   - `AGENT_MODEL` — the model identifier the agent should use.
3. `pnpm start` (alias for `tsx src/index.ts`; `pnpm dev` is identical). The service prints startup logs and then listens for ADP commands on port **9222**.

`yt-dlp` and the `gcloud` CLI must be installed and authenticated on the host (or wherever the tools execute), since the injected tools shell out to them.

**How to add a tool:**

1. Create `src/tools/<name>.ts` exporting a stringified async function (a template-literal string body, mirroring the existing tools — they are serialized and injected into a worker isolate, so write self-contained code that `require`s its own dependencies, e.g. `child_process`).
2. Import it in `src/index.ts` and add it to the `tools: { ... }` map passed to `AgentEventLoop`.
3. Describe the tool and its arguments in the `SYSTEM_PROMPT` so the LLM knows when and how to call it.

**How `Music.StartExtraction` drives the agent:** the handler is registered via `agent.adp.on("Music.StartExtraction", async (params, cb) => { ... })`. It reads `params.songName`, emits a `Music.Status` notification, calls `await agent.run("Please extract the guitar from the song: ...")` to run the full LLM tool-using loop, and finally invokes the `cb` callback with `{ status: "started", agentResponse }` (or an error object if no song name was supplied).

### Testing Requirements

There are no unit tests (`pnpm test` is a placeholder echoing `'No tests'`). Verify changes end-to-end by starting the service (`pnpm start`) and exercising it over ADP:

- Connect a client such as `apps/music-scanner-cli` and trigger an extraction, or
- Use the `agx-cli` ADP REPL (`adp-repl`) to send the `Music.StartExtraction` command (with `{ songName: "..." }`) to port 9222 and observe the `Music.Status` notifications and the returned `agentResponse`.

### Common Patterns

- **Tool injection:** tools are passed as a `tools` map into the `AgentEventLoop` constructor; each is a stringified async function serialized into a thread-pool worker rather than a normal in-process import.
- **ADP handler registration:** custom commands are registered with `agent.adp.on("<Namespace.Command>", handler)` using the EventEmitter-style API; the handler receives `(params, cb)` and must call `cb(result)`.
- **Server-pushed notifications:** stream progress to connected ADP clients with `agent.adp.notify("<Namespace.Event>", payload)` (e.g. `Music.Status`).
- **Lifecycle:** the process is kept alive by the listening ADP server; clean shutdown is handled on `SIGINT` via `await agent.shutdown()`.

## Dependencies

### Internal

- `@agentx/core` (`workspace:*`) — provides `AgentEventLoop`, the LLM orchestration/thread-pool engine, and the ADP integration this host configures.
- `@agentx/adp` (`workspace:*`) — Agent Debug/Control Protocol; backs the `agent.adp` command + notification API used by the `Music.StartExtraction` handler.

### External

- `dotenv` (`^17.4.2`) — loads `.env` (LLM config) at startup.
- `tsx` (via the workspace) — runs the TypeScript entry point directly for `dev`/`start`.
- `typescript` + `@types/node` (catalog) — dev/build dependencies (`pnpm build` runs `tsc`).
- Runtime host binaries (not npm deps): `yt-dlp` and the `gcloud` CLI, invoked by the injected tools.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->

### Architecture update (2026-06-27): multi-tenant + interactive replies

The service no longer constructs a single `AgentEventLoop`. It now builds an
**`AgentSessionHost`** from `@agentx/core` — one shared ADP server / LLM /
thread pool, with **one isolated `AgentSession` per WebSocket connection**, so
concurrent clients never collide. `src/index.ts` exports `createMusicScannerHost()`
and `registerMusicCommands(host)`.

- **`Music.StartExtraction`** is now registered via `host.registerCommand(...)` and
  is scoped to the calling client. Instead of a one-shot `agent.run(...)`, it
  seeds that session's conversation with `ctx.session.enqueuePrompt(...)`. The
  handler still replies `{ status: "started" }` (or `{ status: "error", message }`
  when no `songName` is given) and pushes `Music.Status` via `ctx.notify(...)`.
- **Interactive replies:** each session runs a turn loop; every assistant turn is
  pushed to its client as a `Session.message` event, and the user replies with the
  built-in `Session.prompt` command — advancing the **same** conversation. This is
  how a client answers "which of these matches?" mid-extraction. All events
  (`Music.Status`, `Toolchain.responseReceived`, `Session.message`) are routed to
  the originating client only.
- **Entry guard:** `main()` only boots when `NODE_ENV !== "test"`, so importing
  the module in tests binds no port.
