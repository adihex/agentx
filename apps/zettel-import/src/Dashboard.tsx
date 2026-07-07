import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { STAGES, type ImportState, type StageKey, type StageStatus } from "./pipeline";

const { BOLD, DIM } = TextAttributes;

const COLORS = {
  accent: "#7aa2f7",
  ink: "#c0caf5",
  muted: "#565f89",
  ok: "#9ece6a",
  warn: "#e0af68",
  err: "#f7768e",
};

const STATUS_GLYPH: Record<StageStatus, string> = {
  pending: "·",
  running: "◐",
  done: "✓",
  error: "✗",
  skipped: "–",
};

const STATUS_COLOR: Record<StageStatus, string> = {
  pending: COLORS.muted,
  running: COLORS.warn,
  done: COLORS.ok,
  error: COLORS.err,
  skipped: COLORS.muted,
};

const STAGE_LABEL: Record<StageKey, string> = {
  fetch: "fetch",
  note: "note",
  graph: "graph",
  save: "save",
};

const PHASE_LABEL: Record<ImportState["phase"], string> = {
  listing: "listing sources…",
  processing: "importing sources…",
  indexing: "indexing into ChromaDB…",
  done: "done",
  fatal: "failed",
};

const StageCell = ({ status }: { status: StageStatus }) => (
  <box width={7} flexShrink={0} justifyContent="center" flexDirection="row">
    <text fg={STATUS_COLOR[status]} attributes={status === "pending" ? DIM : 0}>
      {STATUS_GLYPH[status]}
    </text>
  </box>
);

export const Dashboard = ({ state, onQuit }: { state: ImportState; onQuit: () => void }) => {
  useKeyboard((event) => {
    if ((event.ctrl && event.name === "c") || event.name === "q") onQuit();
  });

  const finished = state.phase === "done" || state.phase === "fatal";
  const phaseColor =
    state.phase === "fatal" ? COLORS.err : state.phase === "done" ? COLORS.ok : COLORS.warn;

  return (
    <box flexDirection="column" width="100%" height="100%">
      <box
        border={["bottom"]}
        borderColor={COLORS.muted}
        flexShrink={0}
        paddingX={2}
        paddingTop={1}
        flexDirection="row"
        justifyContent="space-between"
      >
        <box flexDirection="row" gap={1}>
          <text fg={COLORS.accent} attributes={BOLD}>
            zettel-import
          </text>
          <text fg={COLORS.muted}>·</text>
          <text fg={COLORS.muted}>{state.notebookId}</text>
        </box>
        <text fg={phaseColor}>{PHASE_LABEL[state.phase]}</text>
      </box>

      <box flexDirection="row" paddingX={2} paddingTop={1} flexShrink={0}>
        <box flexGrow={1}>
          <text fg={COLORS.muted} attributes={DIM}>
            source
          </text>
        </box>
        {STAGES.map((stage) => (
          <box key={stage} width={7} flexShrink={0} justifyContent="center" flexDirection="row">
            <text fg={COLORS.muted} attributes={DIM}>
              {STAGE_LABEL[stage]}
            </text>
          </box>
        ))}
      </box>

      <scrollbox flexGrow={1} stickyScroll stickyStart="bottom" paddingX={2}>
        {state.rows.map((row) => (
          <box key={row.sourceId} flexDirection="column">
            <box flexDirection="row">
              <box flexGrow={1}>
                <text fg={COLORS.ink}>{row.title}</text>
              </box>
              {STAGES.map((stage) => (
                <StageCell key={stage} status={row.stages[stage]} />
              ))}
            </box>
            {row.detail && (
              <text fg={COLORS.err} attributes={DIM}>
                {"  ↳ "}
                {row.detail}
              </text>
            )}
          </box>
        ))}
        {state.rows.length === 0 && state.phase === "listing" && (
          <text fg={COLORS.muted} attributes={DIM}>
            fetching source list…
          </text>
        )}
        {state.fatalError && (
          <text fg={COLORS.err} attributes={BOLD}>
            {state.fatalError}
          </text>
        )}
      </scrollbox>

      <box
        border={["top"]}
        borderColor={COLORS.muted}
        flexShrink={0}
        paddingX={2}
        paddingTop={1}
        flexDirection="row"
        justifyContent="space-between"
      >
        <box flexDirection="row" gap={1}>
          <text fg={COLORS.muted} attributes={DIM}>
            chromadb index
          </text>
          <text fg={STATUS_COLOR[state.indexStatus]}>
            {STATUS_GLYPH[state.indexStatus]} {state.indexStatus}
          </text>
        </box>
        {state.summary ? (
          <text fg={COLORS.ink}>
            {state.summary.notes} notes · {state.summary.entities} entities ·{" "}
            {state.summary.relations} relations · {state.summary.saved} saved
            {state.summary.failed > 0 ? ` · ${state.summary.failed} failed` : ""}
          </text>
        ) : (
          <text fg={COLORS.muted} attributes={DIM}>
            {finished ? "q to exit" : "ctrl+c to abort"}
          </text>
        )}
      </box>
    </box>
  );
};
