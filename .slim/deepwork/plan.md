# Phased Implementation Plan — Edit Mode UX + Deep Study Dark Mode

## Task A: Edit Mode UX Overhaul

Transform edit mode from simple form to conversational AI editing + manual editing, matching Stitch conversation prototype.

## Task B: Deep Study Mode (Dark Mode)

Implement MD3 dark mode based on Stitch `deep_study/DESIGN.md` spec.

---

## Phase 1: Design Token System Migration (App.css)

**Owner:** @fixer
**Scope:** `apps/zettel/src/frontend/App.css` only
**Goal:** Establish MD3-compliant dual-theme token system

1. Add MD3 dark mode token set under `[data-theme="dark"]` selector:
   - `--surface: #131313`, `--on-surface: #e5e2e1`, `--primary: #ffb4a7`, `--secondary: #d5c4aa`, `--tertiary: #8ccff4`, `--error: #ffb4ab`
   - All container/fixed/variant tokens from DESIGN.md
   - Elevation tokens: `--surface-1: #0e0e0e` through `--surface-4: #353534`
2. Map existing light tokens to MD3 naming (keep old names as aliases):
   - `--paper` → alias for `--surface` (light: `#fff8f6`)
   - `--clay` → alias for `--primary` (light: `#7b180c`)
   - `--ink` → alias for `--on-surface` (light: `#241917`)
3. Add `[data-theme="dark"]` block with all dark overrides for:
   - Base surfaces, text, borders
   - Rail, Canvas, Inspector backgrounds
   - Chat bubbles, inputs, buttons
   - Code blocks, links, markers
4. Add smooth transition: `color-scheme`, `background-color`, `border-color`, `color`
5. Import Material Symbols Outlined font if missing

**Verification:** CSS validates, light mode visually unchanged, dark tokens present and complete

---

## Phase 2: Edit Mode UX Overhaul (App.tsx)

**Owner:** @fixer
**Scope:** `apps/zettel/src/frontend/App.tsx` (edit mode sections, lines ~815–1124)
**Goal:** Conversational AI editing + manual editing matching Stitch conversation prototype

1. Restructure edit mode layout to match Stitch conversation prototype:
   - Left sidebar: note metadata (title, tags, backlinks) — reuse existing links sidebar
   - Center: conversation thread using `MessageScroller` from `@agentx/shared-ui`
   - Bottom: chat input bar for conversational editing (like capture input)
   - Right: context inspector (existing Inspector, showing current note context)
2. Add mode toggle: "Chat Edit" (default) vs "Manual Edit"
   - Manual Edit: existing form (title/body/tags) preserved
   - Chat Edit: conversation thread + input bar
3. Wire conversational AI editing to ADP:
   - Use existing `AdpClient` WebSocket connection
   - Send current note content + edit instruction as context
   - AI responses render as bubbles in `MessageScroller`
   - AI can propose edits (shown as suggestion messages with accept/reject)
4. Edit history in conversation thread:
   - Each AI suggestion logged as a message
   - Accept button applies edit to note content + saves
   - Reject button dismisses suggestion
   - Manual edits also logged as system markers
5. Auto-resize textarea in chat input (matching Stitch prototype JS)

**Verification:** Edit mode shows conversation + manual toggle, AI chat sends/receives via ADP, manual form still works, accept/reject flow functional

---

## Phase 3: Dark Mode Application + Polish (App.tsx + App.css + SemanticVisualizer.tsx)

**Owner:** @fixer
**Scope:** `apps/zettel/src/frontend/App.tsx` (theme toggle), `App.css` (polish), `SemanticVisualizer.tsx`
**Goal:** Apply dark mode across all components, add toggle, final polish

1. Add theme toggle in Rail (sun/moon Material Symbol icon)
2. Wire toggle: `document.documentElement.dataset.theme = 'dark' | 'light'`
3. Persist theme preference in `localStorage`
4. Apply dark mode to `SemanticVisualizer.tsx` (SVG stroke/fill colors read from CSS vars)
5. Apply dark mode to `ToolsManager.tsx` if it has hardcoded colors
6. Polish:
   - Staggered fade-in animations on edit mode entry
   - Smooth theme transition (0.2s ease)
   - Responsive adjustments for smaller screens
   - Auto-resize textarea in chat input
7. Final visual comparison with all 3 Stitch screenshots

**Verification:** Dark mode toggle works, all components themed correctly, matches Stitch deep_study design, no light-mode regressions

---

## Dependency Graph

```
Phase 1 (App.css tokens) ──no dependency──→ Phase 2 (App.tsx edit mode)
                                      └──→ Phase 3 (App.tsx dark toggle + polish)
```

- Phase 1 must complete first (token foundation)
- Phase 2 and Phase 3 both modify App.tsx → must be sequential (same file ownership)
- Execution order: Phase 1 → Phase 2 → Phase 3
- Oracle review before Phase 1, after Phase 1, after Phase 2, after Phase 3

## Risk Notes

- App.tsx is a 1203-line monolith — edits must be surgical to avoid regressions
- ADP WebSocket protocol for AI editing needs verification (how to send note context + receive edit suggestions)
- shared-ui MessageScroller is headless (no CSS) — zettel App.css must style `chat-message-*` classes
- Token aliasing ensures backward compat — old `--paper` references keep working
