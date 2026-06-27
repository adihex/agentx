# syntax=docker/dockerfile:1
FROM node:24.14.0-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
RUN mkdir -p /pnpm && chown -R node:node /pnpm
WORKDIR /app
RUN chown -R node:node /app

# ─── Stage 1: Install dependencies ──────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
# Copy all package.json files so pnpm can resolve the workspace graph
COPY apps/music-scanner-web/package.json ./apps/music-scanner-web/
COPY apps/music-scanner-cli/package.json ./apps/music-scanner-cli/
COPY apps/demo/package.json ./apps/demo/
COPY apps/music-scanner-service/package.json ./apps/music-scanner-service/
COPY apps/agx-web/package.json ./apps/agx-web/
COPY apps/orchestrator-demo/package.json ./apps/orchestrator-demo/
COPY apps/simon-cli/package.json ./apps/simon-cli/
COPY apps/zettel/package.json ./apps/zettel/
COPY apps/pi-extension/package.json ./apps/pi-extension/
COPY packages/core/package.json ./packages/core/
COPY packages/adp/package.json ./packages/adp/
COPY packages/orchestrator/package.json ./packages/orchestrator/
COPY packages/agx-core/package.json ./packages/agx-core/
COPY packages/agx-cli/package.json ./packages/agx-cli/
COPY packages/agx-herdr/package.json ./packages/agx-herdr/
COPY packages/mcp/package.json ./packages/mcp/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ─── Stage 2: Build all packages ────────────────────────────────────────────
FROM deps AS builder
COPY . .

# Copy the Vite+ task cache if populated from GHA cache
COPY .vite-task-cach[e] /tmp/vite-cache/
# Build only zettel + its workspace dependencies (core, adp, agx-core) via Vite+
RUN --mount=type=cache,id=vite-plus,target=/app/node_modules/.vite/task-cache \
    if [ -d /tmp/vite-cache ] && [ "$(ls -A /tmp/vite-cache)" ]; then \
      echo "Seeding Vite+ cache mount from GHA cache..." && \
      cp -r /tmp/vite-cache/* /app/node_modules/.vite/task-cache/; \
    fi && \
    pnpm exec vp run zettel#build

# ─── Web (TanStack Start) ───────────────────────────────────────────────────
FROM base AS web
COPY --chown=node:node --from=builder /app ./
ENV NODE_ENV=production
EXPOSE 3000
ENV PORT=3000
USER node
CMD ["pnpm", "--filter", "music-scanner-web", "start"]

# ─── Music Scanner Service (Agent Host — ADP :9222) ─────────────────────────
FROM base AS scanner
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    gnupg \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - \
    && echo "deb https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list \
    && apt-get update && apt-get install -y google-cloud-cli \
    && pip3 install yt-dlp --break-system-packages \
    && rm -rf /var/lib/apt/lists/*
COPY --chown=node:node --from=builder /app ./
ENV NODE_ENV=production
EXPOSE 9222
USER node
CMD ["pnpm", "--filter", "music-scanner-service", "start"]

# ─── Demo Agent (ADP :9222) ─────────────────────────────────────────────────
FROM base AS demo
COPY --chown=node:node --from=builder /app ./
ENV NODE_ENV=production
EXPOSE 9222
USER node
CMD ["pnpm", "--filter", "demo", "start"]

# ─── AGX Web Dashboard (Vite — :5173) ───────────────────────────────────────
FROM base AS agx-web
COPY --chown=node:node --from=builder /app ./
ENV NODE_ENV=production
EXPOSE 5173
USER node
CMD ["pnpm", "--filter", "agx-web", "preview"]

# ─── Orchestrator Demo ──────────────────────────────────────────────────────
FROM base AS orchestrator-demo
COPY --chown=node:node --from=builder /app ./
ENV NODE_ENV=production
USER node
CMD ["pnpm", "--filter", "orchestrator-demo", "start"]

# ─── Zettel (Agent + Vite) ──────────────────────────────────────────────────
FROM base AS zettel
COPY --chown=node:node --from=builder /app ./
ENV NODE_ENV=production
EXPOSE 5174 9225
USER node
CMD ["pnpm", "--filter", "zettel", "start"]
