# @agentx/pi-extension

Pi TUI frontend for the agentx event-driven AI agent runtime.

## What it does

This extension turns [pi](https://github.com/badlogic/pi-mono) into a control-plane frontend for any agent built with the **agentx SDK**. It connects to the agent's ADP (Agent Debugger Protocol) WebSocket and exposes the full suite of out-of-band commands through pi's slash-command system.

## Features

- **Live connection status** in the pi footer (iteration count, context length, paused/running)
- **Auto-connect** on session start via `--agentx-url` CLI flag
- **Slash commands** for every ADP domain:
  - `/agentx connect [url]` — Connect to agent
  - `/agentx disconnect` — Disconnect
  - `/agentx status` — Show connection & last known call frame
  - `/agentx halt` — Abort active LLM inference (`Inference.halt`)
  - `/agentx pause` / `/agentx resume` — Metacognition control
  - `/agentx inspect` — Introspect live call frame
  - `/agentx compact` — Compact agent memory
  - `/agentx inject <msg>` — Inject a thought into context
  - `/agentx send <msg>` — Send a user message to the agent
- **Custom tools** the LLM can invoke:
  - `agentx_toolchain_list` — List remote agent tools
  - `agentx_memory_query` — Query memory nodes
- **Event streaming** — Server-push ADP events appear as custom messages in the TUI

## Usage

### 1. Start an agentx agent

```bash
# In one terminal
cd apps/demo
pnpm start
```

The demo agent opens its ADP control plane on `ws://localhost:9222`.

### 2. Launch pi with the extension

```bash
# From workspace root
pi -e ./apps/pi-extension/src/extension.ts

# Or connect to a non-default URL
pi -e ./apps/pi-extension/src/extension.ts --agentx-url ws://localhost:9222
```

### 3. Control the agent from pi

```
/agentx status
/agentx halt
/agentx pause
/agentx inspect
/agentx compact
/agentx send "What is the current task?"
```

## Architecture

```
┌─────────┐     WebSocket (JSON-RPC 2.0)     ┌─────────────────┐
│   pi    │ ◄────────────────────────────────►│  AgentEventLoop │
│  + ext  │    ADP commands & server-push     │   (agentx)      │
└─────────┘                                   └─────────────────┘
```

The extension uses `@agentx/adp`'s `AdpClient` to speak the same protocol as the `AdpServer` running inside the agent. Because ADP is out-of-band, you can halt inference or pause the agent even while it is mid-stream.

## Package layout

```
apps/pi-extension/
├── package.json          # pi extension manifest + workspace deps
├── README.md
└── src/
    └── extension.ts      # Main extension entry point
```

## Development

The extension is a standard pi extension. It can be loaded directly from source (pi uses `jiti` for on-the-fly TypeScript execution).

```bash
# Install deps
pnpm install

# Load in pi
pi -e ./apps/pi-extension/src/extension.ts
```

No build step is required.
