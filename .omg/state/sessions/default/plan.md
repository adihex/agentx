# Plan: TanStack Start Migration & Vite 8 Alignment

## Objective
Migrate `apps/web` from raw `vinxi` to `TanStack Start` abstractions and align the monorepo with Vite 8 using `vite-plus`.

## Tasks
- [ ] **P0: Monorepo Version Alignment**
  - Update root `package.json` overrides for `vite` and `@tanstack/*`.
  - Ensure all packages have `vite` 8 as a peer/dev dependency where needed.
- [ ] **P0: Refactor apps/web to TanStack Start**
  - Replace `vinxi` scripts with `@tanstack/start` CLI commands (if available) or standard `vite`.
  - Update `package.json` dependencies: move `vinxi` to dev or remove if redundant.
- [ ] **P1: Vite 8 Compatibility Audit**
  - Check `@vitejs/plugin-react` and other plugins for Vite 8 support.
  - Fix any manifest path issues (previously patched in vinxi).
- [ ] **P2: Monorepo Verification**
  - Run `pnpm vp build` to verify all packages.
  - Run `pnpm vp check` for type-aware linting.

## Baseline
- Branch: `feat/music-scanner-orchestrator`
- Vite: 8.0.10
- TanStack Start: 1.120.x
