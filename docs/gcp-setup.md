# GCP Setup for Zettel

How GCP is configured for the `zettel-service` Cloud Run deployment, including keyless auth.

---

## Infrastructure at a Glance

| Resource          | Value                                                              |
| ----------------- | ------------------------------------------------------------------ |
| GCP Project       | `agentx-zettel-adi-3291`                                           |
| Region            | `asia-south1`                                                      |
| Cloud Run service | `zettel-service`                                                   |
| Artifact Registry | `asia-south1-docker.pkg.dev/agentx-zettel-adi-3291/agentx-repo`    |
| Service account   | `github-actions-sa@agentx-zettel-adi-3291.iam.gserviceaccount.com` |
| WIF pool          | `github-pool`                                                      |
| WIF provider      | `github-provider`                                                  |

---

## Workload Identity Federation (Keyless Auth)

GitHub Actions runners authenticate to GCP **without any stored JSON keys**. Instead, GHA exchanges a short-lived OIDC token for temporary GCP credentials.

```
GitHub Actions runner
    │ issues OIDC token (JWT signed by GitHub)
    ▼
Google Cloud Identity (STS)
    │ verifies token against WIF pool/provider
    ▼
Impersonate github-actions-sa service account
    │
    ▼
Artifact Registry (push) + Cloud Run (deploy)
```

### Re-running setup from scratch

A setup script lives at [`setup-wif.sh`](../setup-wif.sh) in the repo root. It:

1. Enables `iamcredentials`, `sts`, `cloudresourcemanager` APIs
2. Creates the WIF pool (`github-pool`) and OIDC provider (`github-provider`) bound to `repo:adihex/agentx:*`
3. Creates `github-actions-sa` with `roles/run.developer` and `roles/artifactregistry.writer`
4. Grants the pool permission to impersonate the service account

```sh
gcloud auth login
gcloud config set project agentx-zettel-adi-3291
./setup-wif.sh
```

### IAM roles on the service account

| Role                                   | Why                        |
| -------------------------------------- | -------------------------- |
| `roles/artifactregistry.writer`        | Push container images      |
| `roles/run.developer`                  | Deploy Cloud Run revisions |
| `roles/iam.serviceAccountTokenCreator` | WIF token exchange         |

---

## Container Image

Images are tagged with both the Git commit SHA and `latest`:

```
asia-south1-docker.pkg.dev/agentx-zettel-adi-3291/agentx-repo/zettel:<sha>
asia-south1-docker.pkg.dev/agentx-zettel-adi-3291/agentx-repo/zettel:latest
```

Using the SHA tag for deployment (not `latest`) ensures Cloud Run always runs the exact revision that was tested, and makes rollbacks deterministic.

---

## Docker Build Caching

The `deploy-backend` job uses two layers of caching:

**1. Vite+ task cache (cross-job)**
The `validate-and-test` job saves `node_modules/.vite/task-cache` to GHA cache keyed by `pnpm-lock.yaml` hash + commit SHA. `deploy-backend` restores it and copies it into `.vite-task-cache/` so the `Dockerfile` can use it, skipping the TypeScript/Vite build inside Docker entirely.

**2. Docker BuildKit GHA cache (`type=gha`)**

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

Stores Docker layer snapshots in GHA cache storage. On cache hit, layers like `pnpm install` (the slowest step) are replayed from cache — no network downloads.

### Dockerfile cache mount

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
```

The `# syntax=docker/dockerfile:1` directive at the top is required to enable BuildKit `--mount` features.

---

## Cloud Run Configuration

### Environment variables injected at deploy time

| Var          | Value               | Purpose                    |
| ------------ | ------------------- | -------------------------- |
| `COMMIT_SHA` | `${{ github.sha }}` | Reported by `GET /_health` |

### Health check / liveness probe

```
GET /_health → 200 { "status": "ok", "sha": "<sha>" }
```

This endpoint is unauthenticated and used by:

- CI smoke test (3 retries, 5 s apart) before frontend ships
- Can be wired into Cloud Run's startup/liveness probe

### Rolling back a bad deploy

```sh
# Instant traffic switch to previous revision
gcloud run services update-traffic zettel-service \
  --to-revisions=CURRENT-1=100 \
  --region asia-south1

# Or route to a specific revision by name
gcloud run revisions list --service zettel-service --region asia-south1
gcloud run services update-traffic zettel-service \
  --to-revisions=zettel-service-00041-abc=100 \
  --region asia-south1
```

Cloud Run keeps all previous revisions until you delete them — rollbacks are instant (no rebuild).
