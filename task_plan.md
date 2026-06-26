# Task Plan: Ensure proper CI/CD for zettel app

## Goal

Establish a robust, highly secure, and optimized CI/CD pipeline for the multi-tenant Zettel app in the agentx monorepo, integrating automated quality checks (testing, linting, typechecking) and keyless deployment to Google Cloud using GitHub Actions and Workload Identity Federation.

## Current Phase

Phase 4: Verification & Handoff

## Phases

### Phase 1: Requirements & Discovery

- [x] Analyze the user's Docker build configurations and identify bottlenecks
- [x] Check the project package dependencies and test execution structure
- [x] Confirm local/CI environment credentials (repository remote is `adihex/agentx`, project is `agentx-zettel-adi-3291`)
- **Status:** complete

### Phase 2: Design & Setup

- [x] Design `.gcloudignore` to prevent uploading massive folders (e.g. `node_modules` 1.2GB)
- [x] Create `cloudbuild.yaml` with remote Artifact Registry caching configurations (using buildx)
- [x] Update `Dockerfile` to enable BuildKit syntax and mount cache for `pnpm` store
- [x] Design helper shell script `setup-wif.sh` to automate GCP Workload Identity Federation configuration
- [x] Design and write GitHub Actions workflow `.github/workflows/deploy.yml` with keyless authentication
- **Status:** complete

### Phase 3: Quality Gates & Testing

- [x] Run local vitest suite to ensure baseline codebase integrity
- [x] Diagnose and fix SQLite multi-tenant locking bug in `store.test.ts`
- [x] Verify all 282 monorepo tests pass successfully
- [x] Update GHA workflow to run lint, format, typecheck, and test checks before executing docker build/push (Quality Gate)
- **Status:** complete

### Phase 4: Verification & Handoff

- [x] Run validation checks on GitHub Actions syntax
- [x] Ensure all documentation and scripts are clean, executable, and reference the correct resources
- [x] Prepare handoff notes and final status
- **Status:** complete

### Phase 5: Vite+ Monorepo Caching & Optimization (New Goal)

- [x] Identify and resolve `package.json` vs `vite.config.ts` build script conflicts across monorepo packages
- [x] Set up caching-friendly inputs (`input: [{ auto: true }, "!dist/**", "!node_modules/**"]`) to avoid circular cache invalidation
- [x] Cast config declarations to `as any` where needed to resolve TypeScript compiler stack depth limit warnings
- [x] Verify caching correctness on subsequent runs (achieved 95% cache hit rate / 9.65s saved)
- [x] Run pre- and post-tests to guarantee absolute code correctness (all 282 tests passing)
- **Status:** complete

## Key Questions

1. **Should tests run in the CI/CD pipeline before deploying?** Yes, this is standard CI/CD practice to prevent deploying broken code.
2. **How to run tests in GitHub Actions environment?** Since the monorepo uses `mise`, we need to install node and pnpm in the workflow, and then run `pnpm test`.

## Decisions Made

| Decision                                     | Rationale                                                                                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Use `setup-node` + pnpm action in GHA        | Standard and fast way to set up node toolchain in GitHub Actions                                                                             |
| Run full test suite in CI                    | Ensures monorepo integrations and Zettel tests pass before building docker image                                                             |
| Fix `store.test.ts` imports                  | Fixed execution order of ES Modules where database initialization occurred before `process.env.ZETTEL_DIR` was set                           |
| Cache `node_modules/.vite/task-cache` in GHA | Vite+ stores its local task runner cache in this directory. Caching it across runs implements remote-caching-like behavior for Vite+ in GHA. |

## Errors Encountered

| Error                                                 | Attempt | Resolution                                                                                                                                                             |
| ----------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| vitest `database is locked` / `FAILED_TO_CREATE_USER` | 1       | Set `process.env.ZETTEL_DIR` at the module-scope top of `store.test.ts` instead of inside `beforeAll`, preventing parallel tests from using the default user database. |
| Missing compiled dependencies in GHA                  | 1       | Updated GHA build step to use pnpm's recursive dependency filter (`...@agentx/zettel`) to compile core packages before testing.                                        |
