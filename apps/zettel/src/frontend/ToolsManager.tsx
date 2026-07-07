import { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";

interface CustomTool {
  id: string;
  name: string;
  description: string;
  inputSchema: string;
  code: string;
  createdAt: string;
}

interface ToolsManagerProps {
  onClose: () => void;
}

const TOOL_TEMPLATE = `import { z } from "zod";

export const schema = z.object({
  input: z.string().describe("The input to process"),
});

export default async function execute(args: z.infer<typeof schema>) {
  // Your tool logic here
  return { result: args.input };
}
`;

const SCHEMA_TEMPLATE = `{
  "type": "object",
  "properties": {
    "input": {
      "type": "string",
      "description": "The input to process"
    }
  },
  "required": ["input"]
}`;

export default function ToolsManager({ onClose }: ToolsManagerProps) {
  const [tools, setTools] = useState<CustomTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CustomTool | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSchema, setFormSchema] = useState(SCHEMA_TEMPLATE);
  const [formCode, setFormCode] = useState(TOOL_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchTools = useCallback(async () => {
    try {
      const res = await fetch("/api/tools");
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTools();
  }, [fetchTools]);

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormSchema(SCHEMA_TEMPLATE);
    setFormCode(TOOL_TEMPLATE);
    setEditing(null);
    setError("");
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (tool: CustomTool) => {
    setFormName(tool.name);
    setFormDesc(tool.description);
    setFormSchema(tool.inputSchema);
    setFormCode(tool.code);
    setEditing(tool);
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) {
      setError("Name is required.");
      return;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
      setError("Name must start with a letter and contain only letters, numbers, underscores.");
      return;
    }
    if (!formDesc.trim()) {
      setError("Description is required.");
      return;
    }
    // Validate JSON schema
    try {
      JSON.parse(formSchema);
    } catch {
      setError("Input schema must be valid JSON.");
      return;
    }
    if (!formCode.trim()) {
      setError("Code is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const body: Record<string, string> = {
        name,
        description: formDesc.trim(),
        inputSchema: formSchema,
        code: formCode,
      };
      if (editing) {
        body.id = editing.id;
      }

      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || `Save failed (${res.status})`);
      }
      setShowForm(false);
      resetForm();
      await fetchTools();
    } catch (err: any) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tools?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await fetchTools();
    } catch {
      // silent
    }
  };

  return (
    <div className="tools-manager">
      <div className="tools-header">
        <button className="canvas-back" onClick={onClose}>
          ← back
        </button>
        <h2 className="tools-title">Tools</h2>
        <p className="tools-subtitle">
          Extend your Zettelkasten with custom tools. Write a TypeScript function and it becomes
          available to the agent.
        </p>
      </div>

      {showForm ? (
        <div className="tool-form" key={editing?.id ?? "new"}>
          <div className="tool-form-heading">{editing ? "Edit tool" : "New tool"}</div>

          <label className="tool-label">
            Name
            <input
              className="search tool-input"
              type="text"
              placeholder="myTool"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={!!editing}
              spellCheck={false}
            />
          </label>

          <label className="tool-label">
            Description
            <input
              className="search tool-input"
              type="text"
              placeholder="What does this tool do?"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
          </label>

          <label className="tool-label">
            Input Schema <span className="tool-hint">(JSON Schema)</span>
          </label>
          <div className="tool-editor-wrap tool-editor-sm">
            <Editor
              height="180px"
              defaultLanguage="json"
              value={formSchema}
              onChange={(v) => setFormSchema(v ?? "")}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "ui-monospace, 'SF Mono', 'IBM Plex Mono', Menlo, Consolas, monospace",
                lineNumbers: "off",
                scrollBeyondLastLine: false,
                folding: false,
                renderLineHighlight: "none",
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                padding: { top: 12, bottom: 12 },
                tabSize: 2,
                automaticLayout: true,
              }}
            />
          </div>

          <label className="tool-label" style={{ marginTop: "var(--s4)" }}>
            Code <span className="tool-hint">(TypeScript)</span>
          </label>
          <div className="tool-editor-wrap tool-editor-lg">
            <Editor
              height="360px"
              defaultLanguage="typescript"
              value={formCode}
              onChange={(v) => setFormCode(v ?? "")}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "ui-monospace, 'SF Mono', 'IBM Plex Mono', Menlo, Consolas, monospace",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                renderLineHighlight: "gutter",
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                padding: { top: 12, bottom: 12 },
                tabSize: 2,
                automaticLayout: true,
              }}
            />
          </div>

          {error && <p className="tool-error">{error}</p>}

          <div className="tool-form-actions">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </button>
            <button
              className="tool-cancel"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <button className="btn-primary tool-new-btn" onClick={openNew}>
            + New Tool
          </button>

          {loading ? (
            <div className="tool-loading">
              <div className="skeleton" style={{ width: "60%" }} />
              <div className="skeleton" style={{ width: "80%" }} />
              <div className="skeleton" style={{ width: "50%" }} />
            </div>
          ) : tools.length === 0 ? (
            <div className="tool-empty">
              No custom tools yet.{"\n"}
              Create one to give the agent new abilities.
            </div>
          ) : (
            <div className="tool-list">
              {tools.map((t) => (
                <div className="tool-card" key={t.id}>
                  <div className="tool-card-head">
                    <span className="tool-card-name">{t.name}</span>
                    <span className="tool-card-date">
                      {new Date(t.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="tool-card-desc">{t.description}</div>
                  <div className="tool-card-actions">
                    <button className="tool-action-btn" onClick={() => openEdit(t)}>
                      Edit
                    </button>
                    <button
                      className="tool-action-btn tool-action-delete"
                      onClick={() => void handleDelete(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
