import React, { useState, useEffect, useRef } from "react";
import { AdpClient } from "@agentx/agx-core";
import "./App.css";

interface Task {
  id: string;
  task: string;
  time: string;
  completed: boolean;
  createdAt: string;
}

interface Reminder {
  id: string;
  message: string;
  time: string;
  triggered: boolean;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  text: string;
}

export default function App() {
  const [connected, setConnected] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      text: "Hello! I am your Daily Planner Agent. You can ask me to add tasks or set reminders, e.g., 'Add a task to call team at 2 PM' or 'Set a reminder to drink water in 5 minutes'.",
    },
  ]);
  const [input, setInput] = useState("");

  const clientRef = useRef<AdpClient | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Poll tasks & reminders from express api
  const fetchData = async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setReminders(data.reminders || []);
      }
    } catch (e) {
      console.error("Failed to fetch planner data", e);
    }
  };

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => { void fetchData(); }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Connect to Agent via ADP WebSocket on port 9224
  useEffect(() => {
    const client = new AdpClient("ws://localhost:9224");
    clientRef.current = client;

    const offStatus = client.onStatus((status) => {
      setConnected(status);
      if (status) {
        setMessages((p) => [
          ...p,
          { id: Math.random().toString(), role: "system", text: "[Agent Connected]" },
        ]);
      } else {
        setMessages((p) => [
          ...p,
          { id: Math.random().toString(), role: "system", text: "[Agent Disconnected]" },
        ]);
      }
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
            updated[updated.length - 1] = {
              ...last,
              text: last.text + payload.chunk,
            };
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
        // Fetch fresh planner/tasks immediately after inference ends since it might have run a tool
        void fetchData();
      }
      if (ev.method === "Agent.ToolStart") {
        const payload = ev.params as { toolName: string };
        setMessages((p) => [
          ...p,
          {
            id: Math.random().toString(),
            role: "tool",
            text: `🔧 Running: ${payload.toolName}...`,
          },
        ]);
      }
      if (ev.method === "Agent.ToolComplete") {
        const payload = ev.params as { toolName: string; result: any };
        setMessages((p) => [
          ...p,
          { id: Math.random().toString(), role: "tool", text: `✅ Finished: ${payload.toolName}` },
        ]);
        void fetchData();
      }
    });

    client.connect();

    return () => {
      offStatus();
      offEvent();
      client.destroy();
    };
  }, []);

  // Scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !clientRef.current || !connected) return;

    const userMsg = input.trim();
    setMessages((p) => [...p, { id: Math.random().toString(), role: "user", text: userMsg }]);
    setInput("");

    // Send via ADP WebSocket (JSON-RPC 2.0)
    // AdpClient has an underlying raw WebSocket send method or send()
    // Let's use the ws send structure to trigger Session.prompt
    const ws = (clientRef.current as any).ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now().toString(),
          method: "Session.prompt",
          params: { prompt: userMsg },
        }),
      );
    }
  };

  const toggleTask = async (id: string) => {
    try {
      await fetch(`/api/toggle-task?id=${id}`);
      void fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-title">
          <h1>AGENTX DAILY PLANNER</h1>
        </div>
        <div className="header-status">
          <div className="status-indicator">
            <span className="status-label">Agent Engine:</span>
            <span className={`dot ${connected ? "connected" : ""}`}></span>
            <span>{connected ? "Connected" : "Disconnected"}</span>
          </div>
          <div>Port 9224</div>
        </div>
      </header>

      {/* Main content split */}
      <main className="dashboard-main">
        {/* Left Pane - Agenda */}
        <div className="planner-pane">
          {/* Tasks Card */}
          <div className="card" style={{ flexGrow: 3 }}>
            <div className="card-title">
              <span>Daily Tasks</span>
              <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                {tasks.filter((t) => t.completed).length}/{tasks.length} Done
              </span>
            </div>

            <div className="task-list">
              {tasks.length === 0 ? (
                <div className="empty-state">
                  No tasks scheduled for today. Ask the agent to add one!
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-item-left">
                      <div
                        className={`checkbox-custom ${task.completed ? "completed" : ""}`}
                        onClick={() => { void toggleTask(task.id); }}
                      />
                      <span className={`task-text ${task.completed ? "completed" : ""}`}>
                        {task.task}
                      </span>
                    </div>
                    <span className="task-time">{task.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reminders Card */}
          <div className="card" style={{ flexGrow: 2 }}>
            <div className="card-title">Reminders & Alerts</div>

            <div className="reminder-list">
              {reminders.length === 0 ? (
                <div className="empty-state">No reminders set.</div>
              ) : (
                reminders.map((rem) => (
                  <div key={rem.id} className={`reminder-item ${rem.triggered ? "triggered" : ""}`}>
                    <span className="reminder-msg">{rem.message}</span>
                    <div className="reminder-meta">
                      <span className="reminder-time">{rem.time}</span>
                      <span className={`reminder-badge ${rem.triggered ? "fired" : "pending"}`}>
                        {rem.triggered ? "Triggered" : "Scheduled"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Pane - Chat */}
        <div className="chat-pane">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-bar">
            <input
              type="text"
              placeholder={
                connected
                  ? "Tell the agent to add a task, schedule a reminder, or view agenda..."
                  : "Connecting to agent..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={!connected}
            />
            <button onClick={handleSend} disabled={!connected}>
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
