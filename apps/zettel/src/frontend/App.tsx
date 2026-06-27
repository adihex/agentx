import { useState, useEffect, useRef, useCallback } from "react";
import { AdpClient } from "@agentx/agx-core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { authClient } from "./auth-client";
import { api } from "./api-client";
import ToolsManager from "./ToolsManager";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  Message,
  Bubble,
  Attachment,
  Marker,
} from "@agentx/chat-components";
import "./App.css";

interface Note {
  id: string;
  title: string;
  tags: string[];
  links: string[];
  created: string;
  source: "text" | "audio";
  body: string;
}

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  text: string;
}

const isHttps = window.location.protocol === "https:";
const API_BASE = isHttps
  ? "https://zettel-service-594828290101.asia-south1.run.app"
  : window.location.origin;
const ADP_URL = `${isHttps ? "wss:" : "ws:"}//${isHttps ? "zettel-service-594828290101.asia-south1.run.app" : window.location.host}/adp`;

const GREETING_ID = "1";

function BrandMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 2.5c-.6 1 .6 1.9 0 2.9" opacity="0.6" />
      <path d="M11 2.5c-.6 1 .6 1.9 0 2.9" opacity="0.6" />
      <path d="M15 2.5c-.6 1 .6 1.9 0 2.9" opacity="0.6" />
      <path d="M4 8h13v3.5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path d="M17 9.5h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M5.5 20h10" />
    </svg>
  );
}

export default function App() {
  const { data: session, isPending } = authClient.useSession();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [connected, setConnected] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [selectedBacklinks, setSelectedBacklinks] = useState<string[]>([]);
  const [graph, setGraph] = useState<{
    nodes: { id: string; title: string }[];
    edges: { source: string; target: string }[];
  }>({ nodes: [], edges: [] });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: GREETING_ID,
      role: "assistant",
      text: "greeting",
    },
  ]);
  const [input, setInput] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [showTools, setShowTools] = useState(false);

  // Store session token for cross-origin API auth (bypasses 3rd-party cookie blocking)
  useEffect(() => {
    if (session?.session?.token) {
      localStorage.setItem("session_token", session.session.token);
    } else {
      localStorage.removeItem("session_token");
    }
  }, [session]);

  // Reset registration mode and clear user-specific data when user logs out
  useEffect(() => {
    if (!session) {
      setIsRegistering(false);
      setEmail("");
      setPassword("");
      setName("");
      setErrorMsg("");
      setIsSubmitting(false);
      setNotes([]);
      setResults([]);
      setQuery("");
      setSelected(null);
      setSelectedBacklinks([]);
      setGraph({ nodes: [], edges: [] });
      setMessages([
        {
          id: GREETING_ID,
          role: "assistant",
          text: "greeting",
        },
      ]);
    }
  }, [session]);

  const clientRef = useRef<AdpClient | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!session) return;
    try {
      const [notesRes, graphRes] = await Promise.all([api.notes.$get(), api.graph.$get()]);
      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes(data.notes || []);
      }
      if (graphRes.ok) {
        setGraph(await graphRes.json());
      }
    } catch (e) {
      console.error("Failed to fetch notes", e);
    } finally {
      setLoaded(true);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    void fetchNotes();
    const interval = setInterval(() => {
      void fetchNotes();
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchNotes, session]);

  // Connect to the agent via ADP WebSocket.
  useEffect(() => {
    if (!session) return;
    const client = new AdpClient(ADP_URL);
    clientRef.current = client;

    const offStatus = client.onStatus((status) => {
      setConnected(status);
    });

    const offEvent = client.onEvent((ev) => {
      if (ev.method === "Agent.InferenceStart") {
        setMessages((p) => [...p, { id: "streaming-msg", role: "assistant", text: "" }]);
      }
      if (ev.method === "Agent.InferenceChunk") {
        const payload = ev.params as { chunk: string };
        setMessages((p) => {
          const updated = [...p];
          const last = updated[updated.length - 1];
          if (last && last.id === "streaming-msg") {
            updated[updated.length - 1] = { ...last, text: last.text + payload.chunk };
          }
          return updated;
        });
      }
      if (ev.method === "Agent.InferenceEnd") {
        const payload = ev.params as { text: string };
        setMessages((p) => {
          const updated = [...p];
          const last = updated[updated.length - 1];
          if (last && last.id === "streaming-msg") {
            updated[updated.length - 1] = {
              id: Math.random().toString(),
              role: "assistant",
              text: payload.text,
            };
          }
          return updated;
        });
        void fetchNotes();
      }
      if (ev.method === "Agent.ToolStart") {
        const payload = ev.params as { toolName: string };
        setMessages((p) => [
          ...p,
          { id: Math.random().toString(), role: "tool", text: `${payload.toolName}` },
        ]);
      }
      if (ev.method === "Agent.ToolComplete") {
        void fetchNotes();
      }
    });

    client.connect();

    return () => {
      offStatus();
      offEvent();
      client.destroy();
    };
  }, [fetchNotes, session]);

  useEffect(() => {
    if (!session) return;
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, session]);

  // Stop the mic + timer if the component unmounts mid-recording.
  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* already stopped */
      }
      recordStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const callbackURL = window.location.origin + "/zettel/";
      // better-auth resolves with { data, error } rather than throwing on
      // bad credentials, so we surface res.error too — not just exceptions.
      const res = isRegistering
        ? await authClient.signUp.email({ email, password, name, callbackURL })
        : await authClient.signIn.email({ email, password, callbackURL });
      if (res?.error) {
        setErrorMsg(
          res.error.message ||
            (isRegistering
              ? "Couldn't create your workspace. Try a different email."
              : "Those details didn't match. Check your email and password."),
        );
      }
      // On success the session updates and the app renders in place.
    } catch (err: any) {
      console.error("AUTH ERROR:", err);
      setErrorMsg(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="auth-loading">
        <BrandMark size={30} className="auth-mark" />
        <span className="visually-hidden">Loading your study…</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-head">
            <span className="auth-brand">
              <BrandMark size={24} className="auth-mark" />
              <span className="auth-wordmark">
                zettel<b>kattan</b>
              </span>
            </span>
            <h1 className="auth-title">
              {isRegistering ? "Create your workspace" : "Sign in to your study"}
            </h1>
            <p className="auth-sub">
              {isRegistering
                ? "A quiet place for your thoughts to gather and connect."
                : "Pick up where your thinking left off."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="auth-form" noValidate>
            {isRegistering && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-name">
                  Name
                </label>
                <input
                  id="auth-name"
                  className="auth-input"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                  autoFocus
                />
              </div>
            )}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                autoFocus={!isRegistering}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                className="auth-input"
                type="password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {errorMsg && (
              <p className="auth-error" role="alert">
                <svg
                  className="auth-error-icon"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5" />
                  <path d="M12 16.4h.01" />
                </svg>
                <span>{errorMsg}</span>
              </p>
            )}

            <button type="submit" className="btn-primary auth-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  {isRegistering ? "Creating…" : "Signing in…"}
                </>
              ) : isRegistering ? (
                "Create workspace"
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="auth-switch">
            {isRegistering ? "Already have an account?" : "New here?"}{" "}
            <button
              type="button"
              className="auth-switch-btn"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg("");
              }}
              disabled={isSubmitting}
            >
              {isRegistering ? "Sign in" : "Create a workspace"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  const sendPrompt = (promptText: string) => {
    if (!clientRef.current || !connected) return;
    clientRef.current.send({
      method: "Session.prompt",
      params: { prompt: promptText },
    });
  };

  const handleSend = () => {
    if (!input.trim() || !clientRef.current || !connected) return;
    const userMsg = input.trim();
    setMessages((p) => [...p, { id: Math.random().toString(), role: "user", text: userMsg }]);
    setInput("");
    setSelected(null); // return to the thread so the response is visible
    sendPrompt(userMsg);
  };

  const runSearch = (q: string) => {
    setQuery(q);
    const term = q.trim().toLowerCase();
    if (!term) {
      setResults([]);
      return;
    }
    const matched = notes
      .filter((n) => `${n.title}\n${n.tags.join(" ")}\n${n.body}`.toLowerCase().includes(term))
      .slice(0, 30)
      .map((n) => ({
        id: n.id,
        title: n.title,
        snippet: n.body.replace(/\s+/g, " ").slice(0, 140),
      }));
    setResults(matched);
  };

  const openNote = async (id: string) => {
    try {
      const res = await api.note.$get({ query: { id } });
      if (res.ok) {
        const data = await res.json();
        setSelected(data.note as any);
        setSelectedBacklinks(data.backlinks || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAudio = async (file: File) => {
    setTranscribing(true);
    setMessages((p) => [
      ...p,
      { id: Math.random().toString(), role: "system", text: `transcribing ${file.name}` },
    ]);
    try {
      const res = await api.transcribe.$post({
        form: {
          file,
        },
      });
      const data = (await res.json()) as any;
      if (data.transcript?.text) {
        const text = data.transcript.text;
        setMessages((p) => [...p, { id: Math.random().toString(), role: "user", text }]);
        setSelected(null); // return to thread so responses are visible
        sendPrompt(text);
      } else {
        setMessages((p) => [
          ...p,
          {
            id: Math.random().toString(),
            role: "system",
            text: `transcription unavailable: ${data.transcript?.error ?? "unknown error"}`,
          },
        ]);
      }
    } catch (e) {
      setMessages((p) => [
        ...p,
        { id: Math.random().toString(), role: "system", text: `upload failed: ${String(e)}` },
      ]);
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (recording || transcribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];
      const mimeType =
        candidates.find(
          (c) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c),
        ) ?? "";
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recordChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        recordStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordStreamRef.current = null;
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        const type = rec.mimeType || "audio/webm";
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(recordChunksRef.current, { type });
        recordChunksRef.current = [];
        if (blob.size > 0) void handleAudio(new File([blob], `recording.${ext}`, { type }));
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch (err) {
      recordStreamRef.current?.getTracks().forEach((t) => t.stop());
      recordStreamRef.current = null;
      setMessages((p) => [
        ...p,
        {
          id: Math.random().toString(),
          role: "system",
          text: `microphone unavailable: ${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    }
  };

  const stopRecording = () => {
    if (!recording) return;
    setRecording(false);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  };

  const toggleRecord = () => {
    if (recording) stopRecording();
    else void startRecording();
  };

  const titleFor = (id: string): string =>
    graph.nodes.find((n) => n.id === id)?.title ?? notes.find((n) => n.id === id)?.title ?? id;

  const streaming = messages.some((m) => m.id === "streaming-msg");
  const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const activity = recording
    ? `recording ${fmtSecs(recordSecs)}`
    : transcribing
      ? "transcribing audio"
      : streaming
        ? "thinking"
        : "";
  const thread = messages.filter((m) => m.id !== GREETING_ID);

  const listForRail: SearchResult[] = query.trim()
    ? results
    : notes.map((n) => ({
        id: n.id,
        title: n.title || "Untitled",
        snippet: n.body.replace(/\s+/g, " ").slice(0, 140),
      }));

  const linkIds = selected
    ? Array.from(new Set([...(selected.links ?? []), ...selectedBacklinks]))
    : [];

  return (
    <MessageScrollerProvider>
      <div className="app">
      {/* ---------- Index rail ---------- */}
      <aside className="rail">
        <div className="rail-head">
          <div className="brand">
            <BrandMark size={20} className="brand-mark" />
            <span className="wordmark">
              zettel<b>kattan</b>
            </span>
            <span className="rail-count">{notes.length}</span>
          </div>
          <p className="tagline">To jot down your thoughts while enjoying your kattan.</p>
        </div>

        <input
          className="search"
          type="text"
          placeholder="Search notes…"
          value={query}
          onChange={(e) => runSearch(e.target.value)}
        />

        <nav className="index" aria-label="Notes">
          {!loaded ? (
            <>
              <div className="skeleton" style={{ width: "70%" }} />
              <div className="skeleton" style={{ width: "85%" }} />
              <div className="skeleton" style={{ width: "60%" }} />
            </>
          ) : listForRail.length === 0 ? (
            <div className="index-empty">
              {query.trim()
                ? "No notes match that."
                : "No notes yet.\nCapture your first thought below."}
            </div>
          ) : (
            listForRail.map((r) => (
              <button
                key={r.id}
                className={`index-item ${selected?.id === r.id ? "active" : ""}`}
                onClick={() => {
                  void openNote(r.id);
                }}
              >
                <div className="index-item-title">{r.title}</div>
                <div className="index-item-snippet">{r.snippet || "…"}</div>
              </button>
            ))
          )}
        </nav>

        <button
          className={`rail-tools-btn ${showTools ? "active" : ""}`}
          onClick={() => {
            setShowTools(!showTools);
            if (!showTools) setSelected(null);
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          Tools
        </button>

        <div className="rail-foot">
          <span className={`status-dot ${connected ? "on" : ""}`} />
          <span>{connected ? "Connected" : "Connecting…"}</span>
          <button
            type="button"
            className="signout-btn"
            onClick={() => void authClient.signOut()}
            title="Sign out of your Zettelkasten"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ---------- Manuscript canvas ---------- */}
      <main className="canvas">
        <div className="canvas-scroll">
          {showTools ? (
            <ToolsManager onClose={() => setShowTools(false)} />
          ) : selected ? (
            <>
              <button className="canvas-back" onClick={() => setSelected(null)}>
                ← all notes
              </button>
              <div className="note-wrap" key={selected.id}>
                <article>
                  <h1 className="note-title">{selected.title || "Untitled"}</h1>
                  <div className="note-metaline">
                    <span>{selected.id}</span>
                    <span>
                      {new Date(selected.created).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="src">
                      {selected.source === "audio" && <span className="status-dot" />}
                      {selected.source}
                    </span>
                    {selected.tags.map((t) => (
                      <span key={t} className="tag">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="note-body md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.body}</ReactMarkdown>
                  </div>
                </article>

                <aside className="margin">
                  <div className="margin-label">Links</div>
                  {linkIds.length === 0 ? (
                    <div className="margin-empty">
                      No links yet. Capture a related thought and I&apos;ll connect them.
                    </div>
                  ) : (
                    linkIds.map((id) => (
                      <button
                        key={id}
                        className="margin-link"
                        onClick={() => {
                          void openNote(id);
                        }}
                      >
                        {titleFor(id)}
                      </button>
                    ))
                  )}
                </aside>
              </div>
            </>
          ) : (
            <div className="home">
              <div className="home-welcome">
                <h1>A quiet place to think.</h1>
                <p>
                  Tell me a thought — I&apos;ll keep it as an atomic note and link it to what
                  you&apos;ve already written. Or drop an audio file to capture aloud.
                </p>
              </div>

              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent className="thread">
                    {thread.map((msg, idx) => {
                      const isConsecutive = idx > 0 && thread[idx - 1].role === msg.role;
                      
                      return (
                        <MessageScrollerItem
                          key={msg.id}
                          messageId={msg.id}
                          scrollAnchor={msg.role === "user"}
                        >
                          {msg.role === "assistant" ? (
                            <Message
                              role="assistant"
                              isConsecutive={isConsecutive}
                              header={<span>study partner</span>}
                            >
                              <Bubble variant="default" align="left">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                              </Bubble>
                            </Message>
                          ) : msg.role === "user" ? (
                            <Message
                              role="user"
                              isConsecutive={isConsecutive}
                              header={<span>You</span>}
                            >
                              <Bubble variant="accent" align="left">
                                {msg.text}
                              </Bubble>
                            </Message>
                          ) : (
                            <Message role="system" isConsecutive={isConsecutive}>
                              <Marker type={msg.role === "tool" ? "tool" : "system"}>
                                {msg.text}
                              </Marker>
                            </Message>
                          )}
                        </MessageScrollerItem>
                      );
                    })}
                    <div ref={threadEndRef} />
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </div>
          )}
        </div>

        {/* ---------- Docked capture bar ---------- */}
        <div className="capture">
          <div className="capture-inner">
            <div className="capture-activity">
              {activity && (
                <Marker type="status" shimmer={activity.includes("thinking") || activity.includes("transcribing")}>
                  {activity}
                </Marker>
              )}
            </div>
            <div className="capture-row">
              <input
                className="capture-input"
                type="text"
                placeholder={connected ? "Capture a thought…" : "Connecting to agent…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                disabled={!connected}
              />
              <label
                className={`icon-btn ${transcribing ? "busy" : ""}`}
                title="Upload an audio file"
                aria-label="Upload an audio file"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 15V3" />
                  <path d="m7 8 5-5 5 5" />
                  <path d="M5 21h14" />
                </svg>
                <input
                  type="file"
                  accept="audio/*"
                  disabled={transcribing || recording}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleAudio(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                className={`icon-btn ${recording ? "recording" : ""} ${transcribing ? "busy" : ""}`}
                onClick={toggleRecord}
                disabled={transcribing}
                title={recording ? "Stop recording" : "Record a thought"}
                aria-label={recording ? "Stop recording" : "Record a thought"}
              >
                {recording ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor" />
                  </svg>
                ) : (
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <path d="M12 17v4" />
                  </svg>
                )}
              </button>
              <button
                className="btn-primary"
                onClick={handleSend}
                disabled={!connected || !input.trim()}
              >
                Capture
              </button>
            </div>
          </div>
        </div>
      </main>
      </div>
    </MessageScrollerProvider>
  );
}
