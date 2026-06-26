# Zettel CI/CD Pipeline

> **Workflow**: [`.github/workflows/zettel-ci-cd.yml`](../.github/workflows/zettel-ci-cd.yml)
> **Trigger**: Push to `main`, or manually via `gh workflow run zettel-ci-cd.yml`

---

## Pipeline Overview

```
push to main
    │
    ▼
┌─────────────────────┐
│  validate-and-test  │  lint · build · vitest
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   deploy-backend    │  docker build → Artifact Registry → Cloud Run → smoke test
└─────────┬───────────┘
          │  (only if smoke test passes)
          ▼
┌─────────────────────┐
│   deploy-frontend   │  rsync dist/ → adihex/adihex.github.io/zettel/
└─────────────────────┘
```

**Why sequential?** This follows the [expand-contract pattern](https://martinfowler.com/bliki/ParallelChange.html):
the new backend is live and healthy before the frontend that depends on it ships.

---

## Jobs

### `validate-and-test`
- Installs deps (pnpm, cached)
- Runs `vp run @agentx/zettel#build` (Vite+ task cache shared with next job)
- Runs `vitest run apps/zettel`
- Uploads `apps/zettel/dist` as a GHA artifact (`zettel-frontend`, 1-day retention)

### `deploy-backend`
- Restores the Vite+ task cache saved by `validate-and-test`
- Copies cache into `.vite-task-cache/` so Docker can use it
- Authenticates to GCP via **Workload Identity Federation** (keyless, no static keys)
- Builds and pushes to Artifact Registry tagged with both `$COMMIT_SHA` and `latest`
- Deploys to Cloud Run (`zettel-service`, `asia-south1`) with `COMMIT_SHA` env var injected
- **Smoke tests** `GET /api/health` — 3 attempts, 5 s apart
  - On failure: auto-rolls back Cloud Run to previous revision and aborts the pipeline

### `deploy-frontend`
- Downloads the `zettel-frontend` artifact
- Clones `adihex/adihex.github.io` using `PAGES_PAT` secret
- `rsync --delete` syncs `dist/` into `zettel/` (removes stale files)
- Commits and pushes only if there are actual changes

---

## Secrets Required

| Secret | Where used | How to create |
|--------|-----------|---------------|
| `PAGES_PAT` | Cross-repo push to `adihex.github.io` | Classic PAT, `public_repo` scope → `gh secret set PAGES_PAT --repo adihex/agentx` |

WIF credentials are not secrets — they are configured via the workload identity pool. See [`docs/gcp-setup.md`](./gcp-setup.md).

---

## Runbook

### Re-deploy without a code change
```sh
gh workflow run zettel-ci-cd.yml
```

### Roll back the backend manually
```sh
# List revisions
gcloud run revisions list --service zettel-service --region asia-south1

# Route 100% traffic to a specific revision
gcloud run services update-traffic zettel-service \
  --to-revisions=zettel-service-00042-xyz=100 \
  --region asia-south1
```

### Roll back the frontend manually
```sh
git clone https://github.com/adihex/adihex.github.io.git
cd adihex.github.io
git log --oneline zettel/   # find the commit to revert to
git revert HEAD             # or: git checkout <sha> -- zettel/
git push
```

### Check backend health
```sh
curl https://<cloud-run-url>/api/health
# → { "status": "ok", "sha": "<commit-sha>" }
```

### Debug a failed smoke test
```sh
# See Cloud Run logs for the failing revision
gcloud run services logs read zettel-service --region asia-south1 --limit 50
```

---

## Timings (cached runs)

| Job | Time |
|-----|------|
| validate-and-test | ~32 s |
| deploy-backend | ~3 m 45 s |
| deploy-frontend | ~5 s |
| **Total** | **~4 m 30 s** |
