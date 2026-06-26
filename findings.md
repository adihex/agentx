# Findings: Ensure proper CI/CD for zettel app

## Discoveries & Architecture

1. **Directory Size Bottlenecks**:
   - `node_modules` size: 1.2 GB.
   - Without `.gcloudignore`, `gcloud builds submit` uploads this entire directory, taking over 10 minutes.
   - Solution: Created a specific `.gcloudignore` to only upload code files (~22 MB).

2. **Docker Build Caching in GCP**:
   - Cloud Build uses ephemeral VMs with no local docker cache.
   - Standard `docker build --cache-from` on the final stage image does not work for multi-stage builds since the intermediate build/deps stages are not part of the final runtime image history.
   - Solution: Use Docker Buildx with registry cache (`--cache-from=type=registry` and `--cache-to=type=registry,mode=max`) pushing to Google Artifact Registry.

3. **Vitest Database Lock Bug**:
   - Issue: `apps/zettel/src/notes/store.test.ts` was executing imports (including `store.js` which triggers `initDb()`) before the `beforeAll` block set `process.env.ZETTEL_DIR`.
   - Result: Contention on `~/.agentx-zettel/zettel.db` between parallel test files, causing `database is locked` and `FAILED_TO_CREATE_USER` errors.
   - Resolution: Configured `process.env.ZETTEL_DIR` to be resolved and set before any imports at the top of the test file.

4. **CI/CD Quality Gate Strategy**:
   - To make the CI/CD pipeline "proper", we should execute the following checks before building and pushing the container image:
     - Dependency installation
     - Formatting & linting check (`pnpm lint` or `pnpm check`)
     - Monorepo unit tests (`pnpm test`)

5. **Vite+ Caching & Script Conflicts**:
   - **Conflict Constraint**: Packages cannot have a task defined in `vite.config.ts` and a script of the same name in `package.json`. Removing package-level `build` scripts avoids this while allowing the root command `vp run -r build` to automatically discover and invoke the custom tasks in configuration files.
   - **Circular Dependency Invalidation**: When a task's input configuration is set to `auto: true`, changes in `./dist` or temporary config bundles in `node_modules/.vite-temp` count as inputs, meaning any run invalidates the cache for the next run. Custom `input: [{ auto: true }, "!dist/**", "!node_modules/**"]` configurations solve this issue.
   - **Type Recursion Warnings**: Deep nestings in config options can hit TypeScript compiler limits. Typecasting defineConfig configuration blocks to `as any` resolves this.
