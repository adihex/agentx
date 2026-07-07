import { useState } from "react";

interface NotebookLMImportModalProps {
  onClose: () => void;
}

export default function NotebookLMImportModal({ onClose }: NotebookLMImportModalProps) {
  const [mode, setMode] = useState<"select" | "cli" | "enterprise">("select");
  const [notebookId, setNotebookId] = useState("");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Import from NotebookLM</h3>
          <button
            className="modal-close-btn material-symbols-outlined"
            onClick={onClose}
            title="Close"
          >
            close
          </button>
        </div>
        <div className="modal-body">
          {mode === "select" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p>Choose how you would like to import your NotebookLM data:</p>
              <button
                className="btn-primary"
                onClick={() => setMode("cli")}
                style={{ textAlign: "left", padding: "1rem" }}
              >
                <strong>Local CLI (For standard Gmail accounts)</strong>
                <div style={{ fontSize: "0.85em", opacity: 0.8, marginTop: "0.5rem" }}>
                  Run a secure local command that bridges your Chrome session to import your
                  notebooks.
                </div>
              </button>
              <button
                className="btn-primary"
                onClick={() => setMode("enterprise")}
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  backgroundColor: "var(--bg-card)",
                  color: "var(--fg-base)",
                  border: "1px solid var(--border-base)",
                }}
              >
                <strong>Enterprise API (For Google Workspace only)</strong>
                <div style={{ fontSize: "0.85em", opacity: 0.8, marginTop: "0.5rem" }}>
                  Connect using standard Google OAuth. Only works if you have Gemini Enterprise.
                </div>
              </button>
            </div>
          )}

          {mode === "cli" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h4>Local CLI Import</h4>
              <p>To import your notebook, run the following command in your terminal:</p>
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "var(--bg-body)",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                }}
              >
                npx @agentx/zettel-import &lt;NOTEBOOK_ID&gt;
              </div>
              <p>
                We will automatically detect the incoming data and index it into your Zettelkasten.
              </p>
              <button className="tool-cancel" onClick={() => setMode("select")}>
                ← Back
              </button>
            </div>
          )}

          {mode === "enterprise" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h4>Enterprise API Import</h4>
              <p>Enter your Enterprise Notebook ID to begin the import:</p>
              <input
                type="text"
                className="search tool-input"
                placeholder="e.g. 1a2b3c..."
                value={notebookId}
                onChange={(e) => setNotebookId(e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={() => alert("Enterprise import triggered! (To be implemented in backend)")}
              >
                Start Import
              </button>
              <button className="tool-cancel" onClick={() => setMode("select")}>
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
