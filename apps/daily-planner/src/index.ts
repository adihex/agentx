import { createServer } from "vite";
import { AgentEventLoop } from "@agentx/core";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as dotenv from "dotenv";
import { getTasksTool, addTaskTool, scheduleReminderTool } from "./tools/planner.js";

// Required env: OPENAI_API_KEY, OPENAI_BASE_URL (optional), AGENT_MODEL (optional)
dotenv.config();

// Clean up temporary files on start
const plannerPath = path.join(os.tmpdir(), "daily-planner.json");
const remindersPath = path.join(os.tmpdir(), "daily-reminders.json");
if (fs.existsSync(plannerPath)) fs.unlinkSync(plannerPath);
if (fs.existsSync(remindersPath)) fs.unlinkSync(remindersPath);

// Initialize AgentEventLoop
const agent = new AgentEventLoop({
  systemPrompt: [
    "You are a Daily Planner Agent.",
    "You help the user manage their daily schedule, tasks, and reminders.",
    "You have tools to add tasks (addTask), get the daily agenda (getTasks), and schedule reminders (scheduleReminder).",
    "When a user asks you to add a task, do so immediately using addTask.",
    "When they ask you to set a reminder, use scheduleReminder.",
    "Speak politely and keep your responses short.",
    "If a reminder triggers, the system will inject it. Acknowledge the reminder and offer to help further.",
  ].join(" "),
  tools: {
    getTasks: getTasksTool,
    addTask: addTaskTool,
    scheduleReminder: scheduleReminderTool,
  },
  autoTick: true,
  adpPort: 9224,
});

// Forward agent events to ADP control plane
agent.on("inference.start", () => {
  agent.emitAdpEvent("Agent.InferenceStart", {});
});
agent.on("inference.chunk", ({ chunk }) => {
  agent.emitAdpEvent("Agent.InferenceChunk", { chunk });
});
agent.on("inference.end", ({ text }) => {
  agent.emitAdpEvent("Agent.InferenceEnd", { text });
});
agent.on("tool.dispatch", (payload) => {
  agent.emitAdpEvent("Agent.ToolStart", payload);
});
agent.on("tool.complete", (payload) => {
  agent.emitAdpEvent("Agent.ToolComplete", payload);
});

// Start the Vite server with programmatic configuration
const server = await createServer({
  configFile: path.resolve(process.cwd(), "vite.config.ts"),
  server: {
    port: 5173,
  },
  plugins: [
    {
      name: "planner-api",
      configureServer(viteServer) {
        viteServer.middlewares.use((req, res, next) => {
          if (req.url === "/api/data") {
            let tasks = [];
            let reminders = [];

            if (fs.existsSync(plannerPath)) {
              try {
                tasks = JSON.parse(fs.readFileSync(plannerPath, "utf8"));
              } catch {}
            }
            if (fs.existsSync(remindersPath)) {
              try {
                reminders = JSON.parse(fs.readFileSync(remindersPath, "utf8"));
              } catch {}
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ tasks, reminders }));
          } else if (req.url?.startsWith("/api/toggle-task")) {
            const urlParams = new URL(req.url, "http://localhost:5173");
            const id = urlParams.searchParams.get("id");
            if (fs.existsSync(plannerPath) && id) {
              try {
                const tasks = JSON.parse(fs.readFileSync(plannerPath, "utf8"));
                const updated = tasks.map((t: any) =>
                  t.id === id ? { ...t, completed: !t.completed } : t,
                );
                fs.writeFileSync(plannerPath, JSON.stringify(updated, null, 2));
              } catch {}
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true }));
          } else {
            next();
          }
        });
      },
    },
  ],
});

await server.listen();

console.log("┌──────────────────────────────────────────────────┐");
console.log("│         agentx — Daily Planner Web App           │");
console.log("│     Vite Web Interface: http://localhost:5173    │");
console.log("│      Agent ADP WebSocket on port 9224            │");
console.log("└──────────────────────────────────────────────────┘");

// Periodically check and trigger reminders
setInterval(() => {
  if (fs.existsSync(remindersPath)) {
    try {
      const reminders = JSON.parse(fs.readFileSync(remindersPath, "utf8"));
      const now = new Date();
      const currentHHMM = now.toTimeString().substring(0, 5);

      let changed = false;
      reminders.forEach((r: any) => {
        if (!r.triggered) {
          let trigger = false;
          if (r.time.startsWith("+")) {
            const diffMinutes = parseInt(r.time.substring(1));
            const created = new Date(r.createdAt);
            const triggerTime = new Date(created.getTime() + diffMinutes * 60 * 1000);
            if (now >= triggerTime) trigger = true;
          } else {
            if (currentHHMM >= r.time) trigger = true;
          }

          if (trigger) {
            r.triggered = true;
            changed = true;
            console.log(`\n🔔 [Reminder Triggered]: ${r.message}`);
            agent.run(`[SYSTEM REMINDER TRIGGERED]: ${r.message}`).catch((err) => {
              console.error("Failed to notify agent of triggered reminder:", err.message);
            });
          }
        }
      });

      if (changed) {
        fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
      }
    } catch {}
  }
}, 3000);
