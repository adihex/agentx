# @agentx/agx-herdr

**AGX Orchestrator powered by [herdr](https://herdr.dev/) — tmux for agents.**

Replaces the OpenTUI-based `agx-cli` with herdr's native terminal multiplexer,
giving you **persistence** (detach/reattach), **agent awareness**, and
**programmatic control** via Unix socket API.

## Prerequisites

```bash
# Install herdr
curl -fsSL https://herdr.dev/install.sh | sh

# Start herdr (it runs as a background server)
herdr
```

## Usage

```bash
# From the monorepo root
pnpm --filter @agentx/agx-herdr start

# With options
pnpm --filter @agentx/agx-herdr start -- --cwd /path/to/project --session my-session
```

## Layout

The orchestrator creates a herdr workspace with three panes, mirroring the
original agx-cli layout:

```
┌──────────────────────────────────────────┐
│  DAG Orchestrator (agent status overview) │
│  Real-time node progress with ADP events  │
├────────────────────┬─────────────────────┤
│  ADP REPL          │  Execution Logs     │
│  /help for cmds    │  Live ADP events    │
│  /halt /pause etc  │  Tool lifecycle     │
└────────────────────┴─────────────────────┘
```

## Key Differences from agx-cli

| Feature            | agx-cli (OpenTUI)                 | agx-herdr                            |
| ------------------ | --------------------------------- | ------------------------------------ |
| Renderer           | React-based TUI via OpenTUI       | Native terminal via herdr            |
| Persistence        | None — exit kills everything      | Detach/reattach, agents keep running |
| Dependencies       | React, @opentui/core, yoga-layout | Zero UI deps — just Node.js + herdr  |
| Agent awareness    | Manual via ADP events             | Native herdr agent status reporting  |
| Remote access      | Not supported                     | SSH in and run `herdr`               |
| `.scm` loader hack | Required for OpenTUI              | Not needed                           |

## Architecture

```
src/
├── index.ts          # CLI entry point with arg parsing
├── herdr-client.ts   # Typed Node.js client for herdr's Unix socket API
├── orchestrator.ts   # Workspace/pane layout creation
├── dag-watcher.ts    # Top pane: agent status overview
├── adp-repl.ts       # Bottom-left: ADP debugger REPL
└── log-watcher.ts    # Bottom-right: execution log stream
```

### HerdrClient

A full-featured typed client for herdr's socket API:

- **Connection**: Unix domain socket, newline-delimited JSON
- **Request/Response**: workspace/tab/pane CRUD, pane I/O (send_text, send_keys, run, read)
- **Agent Reporting**: `pane.report_agent` for native agent status in herdr's sidebar
- **Event Subscriptions**: long-lived pubsub for lifecycle and output matching
- **Wait Primitives**: `waitForOutput` with substring/regex matching

### Detach / Reattach

```bash
# Detach from herdr (agents keep running)
# Press Ctrl+B Q inside herdr

# Reattach from any terminal (even SSH)
herdr

# Close the AGX workspace
herdr workspace close <workspace_id>
```

## Commands (ADP REPL)

Same as agx-cli:

| Command              | Action                  |
| -------------------- | ----------------------- |
| `/help`              | Show available commands |
| `/pause <agentId>`   | Pause an agent          |
| `/resume <agentId>`  | Resume a paused agent   |
| `/inspect <agentId>` | Dump agent state        |
| `/halt`              | Halt all agents         |
| `/exit`              | Quit REPL               |
