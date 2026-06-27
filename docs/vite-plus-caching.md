# Vite+ Task Caching

This monorepo uses [`vite-plus`](https://npmjs.com/package/vite-plus) (`vp`) as the build orchestrator. It provides intelligent task-level caching with automatic input fingerprinting — similar to Turborepo or Nx, but integrated into Vite.

---

## How it works

`vp run -r build` resolves the full dependency graph of `tasks` defined in each package's `vite.config.ts`, then runs them in topological order. Before running a task, it hashes all declared inputs. If the hash matches a previous run, it replays the cached output instead.

```
vp run zettel#build
    │
    ├── @agentx/adp#build       (tsdown)
    ├── @agentx/core#build      (tsdown)
    └── @agentx/agx-core#build  (tsc)
            │
            ▼
        zettel#build    (tsc -b && tsc -p tsconfig.server.json && vite build)
```

Cache is stored in `node_modules/.vite/task-cache/`.

---

## Cache configuration

Each task in `vite.config.ts` should follow this pattern:

```ts
// vite.config.ts
run: {
  tasks: {
    build: {
      command: "tsc -b && vite build",
      output: ["dist/**", "dist-server/**"],
      input: [
        { auto: true },       // auto-track all source files
        "!dist/**",           // exclude build outputs (prevent circular invalidation)
        "!dist-server/**",
        "!node_modules/**",   // exclude deps (tracked via lockfile hash separately)
      ],
      dependsOn: ["@agentx/core#build"],  // upstream packages
    },
  },
},
```

### Critical rules

| Rule                                                 | Why                                                                                           |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Always exclude `!dist/**` from inputs                | Without this, the task's own output invalidates its cache immediately                         |
| Always exclude `!node_modules/**`                    | Prevents temp files written by bundlers from poisoning the hash                               |
| Don't duplicate task names as `package.json` scripts | `vp` and `npm` conflict — remove `"build"` from `package.json` if it's defined as a `vp` task |

---

## Measured performance

| Metric              | Cold (no cache) | Warm (cache hit)       |
| ------------------- | --------------- | ---------------------- |
| Full monorepo build | ~10.5 s         | **< 1.2 s**            |
| Cache hit rate      | 0 %             | **95 %** (20/21 tasks) |
| Tests               | 282 / 282       | 282 / 282              |

The one uncached task is `pi-extension#build` which runs `echo` — correctly skipped by `vp` since zero-cost commands don't benefit from caching.

---

## CI integration

The Vite+ cache is shared between the `validate-and-test` and `deploy-backend` jobs via `actions/cache`:

**Save** (in `validate-and-test`):

```yaml
- uses: actions/cache@v4
  with:
    path: node_modules/.vite/task-cache
    key: ${{ runner.os }}-vite-plus-${{ hashFiles('pnpm-lock.yaml') }}-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-vite-plus-${{ hashFiles('pnpm-lock.yaml') }}-
      ${{ runner.os }}-vite-plus-
```

**Restore** (in `deploy-backend`):

```yaml
- uses: actions/cache/restore@v4
  with:
    path: node_modules/.vite/task-cache
    key: ${{ runner.os }}-vite-plus-${{ hashFiles('pnpm-lock.yaml') }}-${{ github.sha }}
```

Then copied into `.vite-task-cache/` so Docker's build context can access it:

```sh
cp -r node_modules/.vite/task-cache/* .vite-task-cache/
```

This means the TypeScript/Vite compilation inside Docker is a cache replay — effectively free.

---

## Running locally

```sh
# Build everything in the monorepo (cached)
mise exec -- pnpm exec vp run -r build

# Build just zettel and its deps
mise exec -- pnpm exec vp run zettel#build

# Force a fresh build (ignore cache)
mise exec -- pnpm exec vp run zettel#build --force

# Run tests (from repo root — vitest globs are root-relative)
mise exec -- pnpm test
```
