# agentx

> Event-Driven AI Agent Runtime SDK — modeled on Node.js and the Chrome DevTools Protocol.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   Event-Driven Agent Runtime                      │
│                                                                   │
│   ┌─────────┐    ┌──────────────┐    ┌──────────────────────┐    │
│   │ Timers  │───▶│ I/O Callbacks│───▶│   Inference (LLM)    │    │
│   │ (TTL)   │    │ (Tool Results)│    │ (Streaming + Abort)  │    │
│   └─────────┘    └──────────────┘    └──────────────────────┘    │
│                          ▲                     │                  │
│                          │                     ▼                  │
│                  ┌───────┴────┐       ┌────────────────┐         │
│                  │  Macrotask │       │   Microtask    │         │
│                  │   Queue    │       │ Queue (Guards) │         │
│                  └───────┬────┘       └────────────────┘         │
│                          │                                        │
│                  ┌───────┴────────────┐                           │
│                  │ Agentic Thread Pool │                          │
│                  │  (worker_threads)   │                          │
│                  └────────────────────┘                           │
└──────────────────────────────────────────────────────────────────┘
         ▲
         │ WebSocket (JSON-RPC 2.0)
         │ Out-of-Band — bypasses event loop
         ▼
┌────────────────────────┐
│ Agent Debugger Protocol │
│        (ADP)            │
│  ├─ Inference.halt      │
│  ├─ Metacognition.pause │
│  ├─ Memory.compact      │
│  └─ Toolchain.intercept │
└────────────────────────┘
```

## Packages

| Package | Description |
|---------|-------------|
| `@agentx/adp` | Agent Debugger Protocol — JSON-RPC schemas, WebSocket server & client |
| `@agentx/core` | Runtime — AgentEventLoop, AgenticThreadPool, LLMOrchestrator |
| `apps/demo` | Prototype agent demonstrating non-blocking tools + ADP control |
| `apps/pi-extension` | Pi TUI frontend — control agentx from inside pi |

## Quick Start

```bash
# Install
pnpm install

# Build packages
pnpm build

# Configure your LLM (OpenAI-compatible)
cp apps/demo/.env.example apps/demo/.env
# Edit .env with your API key and base URL

# Run the interactive agent (stays alive, waits for ADP prompts)
cd apps/demo && pnpm start

# In another terminal — control from pi
cd apps/pi-extension && pi -e ./src/extension.ts

# Or use the low-level admin CLI
cd apps/demo && pnpm admin           # Inference.halt
cd apps/demo && pnpm admin pause     # Metacognition.pause
cd apps/demo && pnpm admin inspect   # Get call frame
cd apps/demo && pnpm admin compact   # Compact memory
```

## How It Works

1. **Non-blocking tools**: Heavy computation runs in `worker_threads`. The main loop continues LLM inference without waiting.
2. **4-phase event loop**: Timers → I/O Callbacks → Inference → Check (microtasks/guards).
3. **ADP control plane**: A WebSocket on port 9222 accepts JSON-RPC commands that bypass the event queue entirely, enabling instant `/stop`, `/pause`, and memory compaction.
4. **Interactive prompt loop**: The agent stays alive and waits for `Session.prompt` commands via ADP. This lets external frontends (like the pi extension) drive the agent interactively.

## Based On

[Architectural Blueprint for an Event-Driven AI Agent Runtime](https://docs.google.com/document/d/18lS5y_T_yyaoK1wxWjYhMAlC_vMdbT49xwNuR9ieKaw) — adapting Node.js paradigms and out-of-band debugging protocols for AI agents.
