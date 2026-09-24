# Niteshift development environment

The default preview is the AGX dashboard on port 5173, backed by the demo
runtime on internal port 9222. Vite proxies `/adp` so remote browsers use the
same authenticated preview origin for HTTP and WebSockets. The dashboard has
no application login. Its initial nodes and logs are built-in sample data;
the ADP indicator reports the actual connection.

Setup installs the repository's pinned mise toolchains, frozen pnpm workspace
dependencies, Playwright browsers and system dependencies, and the shared
runtime, orchestrator, and dashboard packages. It does not start background
processes. No resume script is needed: installed tools and dependencies persist,
and Niteshift restarts the declared services automatically.

Add `OPENAI_API_KEY` to the repository's Niteshift environment variables. The
runtime receives it through a secret reference; it cannot start until that
variable exists. The manifest defaults to the OpenAI API and `gpt-4o`, matching
the demo's example environment. Change `OPENAI_BASE_URL` and `AGENT_MODEL` in
`services.yaml` when using another compatible provider.

Run `ns services status --wait`, `ns services logs runtime`, or
`ns services restart dashboard runtime` to operate the environment. Rebuild a
changed library with `mise exec -- pnpm exec vp run @agentx/core#build` (or its
own package task), then restart the runtime. Dashboard source changes use HMR.
Run tests from the repository root with `mise exec -- pnpm test`.

Other applications, including Music Scanner and Zettel, remain opt-in workflows;
they require their own service and provider configuration. This setup does not
provision cloud resources, authenticate Google Cloud, or run extraction jobs.
