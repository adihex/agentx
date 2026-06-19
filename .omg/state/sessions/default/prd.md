# PRD: TanStack Start & Vite 8 Integration

## Acceptance Criteria
1. **Vite 8 Everywhere**: All packages must build using Vite 8.0.x.
2. **TanStack Start Native**: `apps/web` must use TanStack Start configuration and CLI, minimizing direct `vinxi` script usage.
3. **Monorepo Built**: `pnpm vp run -r build` passes for all packages and apps.
4. **Version Consistency**: No conflicting versions of `@tanstack/*` or `vite` in the monorepo (enforced by overrides).

## Non-Goals
- Removing `vinxi` entirely (TanStack Start depends on it, but we want to use the Start abstractions).
- Major UI refactoring.

## Evidence Required
- `pnpm list -r vite` showing version 8.x.
- `apps/web` running with TanStack Start.
- Success logs from `vp build`.
