FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/cli/package.json ./apps/cli/
COPY apps/demo/package.json ./apps/demo/
COPY apps/music-scanner-service/package.json ./apps/music-scanner-service/
COPY packages/core/package.json ./packages/core/
COPY packages/adp/package.json ./packages/adp/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Stage 2: Build all packages
FROM deps AS builder
COPY . .
RUN pnpm run build

# Stage 3: Final Runner for Web
FROM base AS web
COPY --from=builder /app ./
EXPOSE 3000
ENV PORT=3000
CMD ["pnpm", "--filter", "@agentx/web", "start"]

# Stage 4: Final Runner for Scanner
FROM base AS scanner
# Install system dependencies for music processing tools
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
COPY --from=builder /app ./
CMD ["pnpm", "--filter", "music-scanner-service", "start"]

# Stage 5: Final Runner for Demo
FROM base AS demo
COPY --from=builder /app ./
CMD ["pnpm", "--filter", "@agentx/demo", "start"]
