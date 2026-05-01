# Music Scanner Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an end-to-end music extraction service that searches for songs, downloads them, and orchestrates audio separation on Cloud Run using the `agentx` library.

**Architecture:** A new service `apps/music-scanner-service` will consume a refactored `@agentx/core` that supports injectable tools. The service will manage search (yt-dlp), GCS uploads, and Cloud Run execution as injected tools.

**Tech Stack:** Node.js (TypeScript), Python (yt-dlp, spleeter), GCP (Cloud Run, GCS), agentx (Agentic Runtime).

---

### Task 1: Refactor @agentx/core for Tool Injectability

**Files:**
- Modify: `packages/core/src/AgenticThreadPool.ts`
- Modify: `packages/core/src/AgentEventLoop.ts`

- [ ] **Step 1: Update AgenticThreadPool to accept dynamic tools**
Update the constructor to take a `tools` map and dynamically generate the `WORKER_SCRIPT`.

- [ ] **Step 2: Update AgentEventLoop to pass tools to ThreadPool**
Modify `AgentEventLoopOptions` and constructor.

- [ ] **Step 3: Run build and verify core still works**
Run: `pnpm --filter @agentx/core build`

- [ ] **Step 4: Commit core refactor**
```bash
git add packages/core
git commit -m "refactor(core): support injectable tools in thread pool"
```

### Task 2: Implement Search & Download Tools in Service

**Files:**
- Create: `apps/music-scanner-service/src/tools/search.ts`
- Create: `apps/music-scanner-service/src/tools/download.ts`

- [ ] **Step 1: Implement search tool using yt-dlp**
- [ ] **Step 2: Implement download tool and GCS upload**
- [ ] **Step 3: Commit tools**
```bash
git add apps/music-scanner-service/src/tools
git commit -m "feat(music-scanner): add search and download tools"
```

### Task 3: Implement Cloud Run Orchestration Tool

**Files:**
- Create: `apps/music-scanner-service/src/tools/cloudrun.ts`

- [ ] **Step 1: Implement trigger tool for Cloud Run Service**
- [ ] **Step 2: Implement polling for GCS results**
- [ ] **Step 3: Commit orchestration tool**
```bash
git add apps/music-scanner-service/src/tools/cloudrun.ts
git commit -m "feat(music-scanner): add cloud run trigger tool"
```

### Task 4: Create Orchestrator App

**Files:**
- Create: `apps/music-scanner-service/src/index.ts`
- Create: `apps/music-scanner-service/package.json`

- [ ] **Step 1: Initialize AgentEventLoop with injected tools**
- [ ] **Step 2: Set up the main execution loop and ADP server**
- [ ] **Step 3: Commit orchestrator app**

### Task 5: Build Premium Web UI

**Files:**
- Create: `apps/music-scanner-service/ui/index.html`
- Create: `apps/music-scanner-service/ui/style.css`
- Create: `apps/music-scanner-service/ui/app.js`

- [ ] **Step 1: Design glassmorphic UI with progress tracking**
- [ ] **Step 2: Connect UI to agent via WebSocket (ADP)**
- [ ] **Step 3: Commit UI**
```bash
git add apps/music-scanner-service/ui
git commit -m "feat(music-scanner): add premium web ui"
```
