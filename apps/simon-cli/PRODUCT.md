# Product

## Register

product

## Users

Developers and power users on macOS/Linux who live in the terminal. They open `simon` in a split pane mid-work to answer a fast question — "what's eating my CPU?", "am I out of memory?", "what should I kill?" — and to let an agent triage and act (inspect processes, kill a runaway PID, clean temp files) with their explicit approval. They expect the instrument to stay out of the way until something actually needs attention.

## Product Purpose

`simon` is an AI-assisted system monitor and optimizer that runs as a terminal UI (`@opentui/react`). It continuously surfaces live telemetry (CPU, memory, load, uptime) and pairs it with a conversational agent that can run read-only diagnostics and, only on approval, take corrective action. Success is: the user gets an accurate read of system state and a safe, confirmable next action in seconds — without leaving the terminal or trusting a black box.

## Brand Personality

Calm, precise, trustworthy — an instrument, not a toy. Three words: **quiet, exact, in-control**. The interface speaks softly by default and uses color only to mean something: brand identity (one accent) and severity (healthy → elevated → critical). It never alarms without cause, and it always asks before it acts on anything destructive.

## Anti-references

- **Neon "hacker" dashboards** — matrix-green rain, rainbow ANSI, glowing everything. Loud for its own sake.
- **The default-ANSI rainbow** — every message role and label a different primary color with no system. Color as decoration, not meaning.
- **Box-in-box-in-box TUIs** — every region wrapped in its own heavy border until the screen is a thicket of corner glyphs.
- **Giant-number SaaS hero metrics** — oversized stat with a gradient and a tiny label, repeated in identical cards.

## Design Principles

1. **Color means something.** One accent for identity; a semantic ramp (ok/warn/crit) reserved for data severity. If it isn't brand or status, it's neutral.
2. **Quiet until it matters.** Healthy state is calm and low-contrast; the UI escalates visually only as load rises. A monitor at rest should feel at rest.
3. **Show the shape of the data.** A monitor must visualize — sparklines, gauges, severity color — not print numbers a user has to decode. 95% must not look like 5%.
4. **Structure with space, not borders.** Separate regions with rhythm, dim rules, and alignment before reaching for a box.
5. **Safe by default.** Destructive actions (kill, clean) are visually flagged and never taken without explicit confirmation.

## Accessibility & Inclusion

- **Honor `NO_COLOR`.** When set, drop all color and convey state through glyphs (`✓ ! ✗`), weight, and position instead — the layout must read correctly in pure monochrome.
- **Never rely on color alone** for severity; pair every color cue with a glyph or label (colorblind-safe).
- **Respect reduced motion.** Animation (thinking spinner) is gentle and is disabled under `NO_COLOR`; no rapid blinking.
- **Theme-agnostic contrast.** Primary values use the terminal's default foreground so they stay legible on both light and dark terminal themes; only secondary/accent text is explicitly colored.
