// Design system for sysmon — a "calm ops console".
//
// Principles (see PRODUCT.md):
//  - Color means something: ONE accent for identity, a semantic ramp for severity.
//  - Quiet until it matters: healthy state is low-contrast; color escalates with load.
//  - Honor NO_COLOR: collapse every color to the terminal default and lean on glyphs.
//
// Primary VALUES intentionally use the terminal's default foreground (undefined fg)
// so they stay legible on both light and dark terminal themes. Only secondary,
// accent, and severity text is explicitly colored.

/** When NO_COLOR is set we drop all color and reduced-motion kicks in. */
export const NO_COLOR = Boolean(process.env.NO_COLOR);
export const REDUCED_MOTION = NO_COLOR || Boolean(process.env.SYSMON_NO_MOTION);

/**
 * Raw palette (dark-terminal optimized hex). OpenTUI downsamples gracefully on
 * 256/16-color terminals, so truecolor values are safe to author directly.
 */
export const RAW = {
  accent: "#5bd2c7", // teal — the single brand/identity hue
  ink: "#c8d3e0", // soft near-white, for emphasis where default fg won't do
  muted: "#7c8a99", // slate — labels and secondary text (>4.5:1 on dark)
  border: "#2c3a47", // dim structure lines / section rules
  track: "#3a4754", // gauge empty-track
  ok: "#73d49a", // healthy
  warn: "#e3b341", // elevated
  crit: "#f7768e", // critical (soft rose-red, calm even when alarming)
} as const;

/** Returns the hex color, or undefined under NO_COLOR (→ terminal default fg). */
export const col = (hex?: string): string | undefined => (NO_COLOR ? undefined : hex);

// ── Severity ─────────────────────────────────────────────────────────────────

export type Severity = "ok" | "warn" | "crit";

/** Color for a severity level, NO_COLOR-aware. `ok` stays neutral (calm at rest). */
export function sevColor(s: Severity): string | undefined {
  if (s === "crit") return col(RAW.crit);
  if (s === "warn") return col(RAW.warn);
  return undefined; // healthy → default fg, no alarm color
}

/** A glyph that encodes severity even with color stripped (colorblind / NO_COLOR safe). */
export function sevGlyph(s: Severity): string {
  return s === "crit" ? "▲" : s === "warn" ? "●" : "·";
}

/** Percentage-based severity (CPU, memory). */
export function pctSeverity(pct: number, warn = 70, crit = 88): Severity {
  if (pct >= crit) return "crit";
  if (pct >= warn) return "warn";
  return "ok";
}

/** Load-average severity, normalized against core count. */
export function loadSeverity(load1: number, cores: number): Severity {
  const ratio = cores > 0 ? load1 / cores : load1;
  if (ratio >= 1.0) return "crit";
  if (ratio >= 0.7) return "warn";
  return "ok";
}

// ── Visualizations ─────────────────────────────────────────────────────────-

const SPARK_TICKS = "▁▂▃▄▅▆▇█";

/**
 * Render a unicode sparkline from a series of 0–100 values, right-aligned into
 * `width` cells. Short histories are left-padded with the baseline tick so the
 * line always spans the full width.
 */
export function sparkline(values: number[], width: number): string {
  if (width <= 0) return "";
  const recent = values.slice(-width);
  const padded = [...Array(Math.max(0, width - recent.length)).fill(0), ...recent];
  const span = SPARK_TICKS.length - 1;
  return padded
    .map((v) => {
      const clamped = Math.max(0, Math.min(100, v));
      const idx = Math.round((clamped / 100) * span);
      return SPARK_TICKS[idx];
    })
    .join("");
}

/** Split a percentage into filled / empty halves of a `width`-cell gauge bar. */
export function gauge(pct: number, width: number): { filled: string; empty: string } {
  const clamped = Math.max(0, Math.min(100, pct));
  const filledCells = Math.round((clamped / 100) * width);
  return {
    filled: "█".repeat(filledCells),
    empty: "░".repeat(Math.max(0, width - filledCells)),
  };
}

// ── Formatters ───────────────────────────────────────────────────────────────

/** Compact uptime: "4h 12m", "3d 7h", or "12m". */
export function formatUptime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** Parse a "12.3%" or "12.3" string to a number; NaN-safe → 0. */
export function parsePercent(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Gentle braille spinner frames for the agent "thinking" state. */
export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;

/** Tools that mutate the system — flagged amber and never auto-run without approval. */
export function isDestructiveTool(name: string): boolean {
  return name === "killProcess" || name === "cleanTempFiles";
}
