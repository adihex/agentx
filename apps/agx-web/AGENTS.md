<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# agx-web

## Purpose

`@agentx/agx-web` is the browser-based "AGX Orchestrator Dashboard" — a Vite + React single-page app that visualizes a live agentx run. It renders a DAG pane of agent `NodeCard`s, an Agent Debugger Protocol (ADP) REPL, and a streaming execution-log tail. It connects to the agentx runtime over the ADP WebSocket (`ws://localhost:9222`), consuming the shared `AdpClient`, reducers, default state, and theme constants from `@agentx/agx-core`, so it is the web counterpart to the terminal-based `agx-cli`/`agx-herdr` frontends rather than a standalone mock UI.

## Key Files

| File                                                         | Description                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`                                               | Entry point. Mounts `<App />` into `#root` under React `StrictMode`; imports `index.css`.                                                                                                                                                                                                                                     |
| `src/App.tsx`                                                | Thin root component that renders `<Dashboard />`.                                                                                                                                                                                                                                                                             |
| `src/Dashboard.tsx`                                          | Main UI. Lays out the header (ADP LIVE/OFFLINE indicator), the DAG pane (SVG edges + positioned `NodeCard`s driven by `nodes`), the ADP REPL form (`sendCommand`), and the `LogRow` execution-log tail. Uses `STATUS_HEX`/`LOG_HEX` from agx-core for colors.                                                                 |
| `src/useAdp.ts`                                              | React hook bridging UI to the runtime. Instantiates `AdpClient(url)`, subscribes via `onStatus`/`onEvent`, dispatches `Agent.StatusUpdate` through `nodeReducer`, appends `Log.Entry`/`Debugger.Response` output, and exposes `{ connected, nodes, logs, replOutput, sendCommand }`. Re-exports `AgentNode`/`LogEntry` types. |
| `src/index.css`                                              | Tailwind base/components/utilities, dark theme tokens, glow utilities, and scrollbar styling.                                                                                                                                                                                                                                 |
| `src/App.css`                                                | Legacy Vite-template styles (not the primary stylesheet).                                                                                                                                                                                                                                                                     |
| `index.html`                                                 | HTML shell. Sets the `AGX Orchestrator Dashboard` title, loads Google Fonts (JetBrains Mono, Space Grotesk) and Material Symbols, mounts `/src/main.tsx`.                                                                                                                                                                     |
| `vite.config.ts`                                             | Vite config — `@vitejs/plugin-react` only.                                                                                                                                                                                                                                                                                    |
| `tailwind.config.js` / `postcss.config.js`                   | Tailwind + PostCSS (autoprefixer) setup.                                                                                                                                                                                                                                                                                      |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | Project-reference TS configs (bundler resolution, `react-jsx`, strict unused checks).                                                                                                                                                                                                                                         |
| `eslint.config.js`                                           | Flat ESLint config (JS + typescript-eslint + react-hooks/react-refresh).                                                                                                                                                                                                                                                      |
| `public/`                                                    | Static assets served as-is: `favicon.svg`, `icons.svg`.                                                                                                                                                                                                                                                                       |
| `src/assets/`                                                | Bundled assets: `hero.png`, `react.svg`, `vite.svg`.                                                                                                                                                                                                                                                                          |

## For AI Agents

### Working In This Directory

- Stack: Vite + React 19 (TypeScript), styled with Tailwind CSS v3. Pure client-side SPA — no SSR, no router, no backend of its own.
- Run via `package.json` scripts (use the workspace package manager; build agx-core first since it is `workspace:*`):
  - `dev` → `vite` (HMR dev server).
  - `build` → `tsc -b && vite build` (type-check via project references, then bundle to `dist/`).
  - `preview` → `vite preview` (serve the built `dist/`).
  - `lint` → `eslint .`.
  - `test` → currently `echo 'No tests'` (placeholder).
- Runtime connection: the UI talks to the agentx runtime exclusively through `useAdp`, which opens an `AdpClient` WebSocket to `ws://localhost:9222` (the ADP control plane). When no ADP server is running it falls back to `DEFAULT_NODES`/`DEFAULT_LOGS` and shows "ADP OFFLINE". REPL submissions open a one-shot `WebSocket` and send a JSON-RPC message whose `method` is the slash command rewritten as `Debugger.<cmd>`. To exercise the live dashboard, start the agentx orchestrator/ADP server so port 9222 accepts connections.

### Testing Requirements

- No tests in this package; the `test` script is a placeholder (`echo 'No tests'`). Protocol-level logic (`AdpClient`, `nodeReducer`, command parsing) is unit-tested in `@agentx/agx-core`, so prefer adding shared-logic tests there. If adding UI tests here, wire up a runner (e.g. Vitest) and replace the placeholder script.

### Common Patterns

- Keep all ADP/runtime logic inside `useAdp.ts`; components stay presentational and receive `nodes`/`logs`/`connected`/`sendCommand` as data. Mirror the agx-cli/agx-herdr pattern of one `AdpClient` per connection with `onStatus`/`onEvent` subscriptions that are unsubscribed on cleanup.
- Source shared state shapes, reducers, defaults, and color maps (`STATUS_HEX`, `LOG_HEX`, `DEFAULT_NODES`, `DEFAULT_LOGS`, `nowHHMMSS`, `nodeReducer`) from `@agentx/agx-core` rather than redefining them — this keeps the web and terminal frontends in sync.
- Styling uses Tailwind utility classes plus inline `style` objects driven by the agx-core hex palette; the dark "terminal" aesthetic (cyan `#00dbe7`, green `#2ff801`) is defined in `index.css` and `tailwind.config.js`.

## Dependencies

### Internal

- `@agentx/agx-core` (`workspace:*`) — the only internal dependency. Provides `AdpClient`, `DEFAULT_NODES`, `DEFAULT_LOGS`, `nowHHMMSS`, `nodeReducer`, the `STATUS_HEX`/`LOG_HEX` color maps, and the `AgentNode`/`LogEntry` types.

### External

- `react`, `react-dom` (via workspace `catalog:`) — UI runtime.
- `vite`, `@vitejs/plugin-react` — dev server and build.
- `tailwindcss`, `postcss`, `autoprefixer` — styling pipeline.
- `typescript`, `eslint`, `typescript-eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `@types/*` — type-checking and linting (dev).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
