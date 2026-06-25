/**
 * Daily Planner Tools
 *
 * Required env vars: OPENAI_API_KEY, OPENAI_BASE_URL (optional), AGENT_MODEL (optional)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { z } from "zod";
import type { ToolDefinition } from "@agentx/core";

// ── Schemas ──────────────────────────────────────────────────────────────────

export const getTasksSchema = z.object({});
export type GetTasksInput = z.infer<typeof getTasksSchema>;

export const addTaskSchema = z.object({
  task: z.string().min(1).describe("The task description"),
  time: z.string().min(1).describe("Time for the task, e.g. '14:00'"),
});
export type AddTaskInput = z.infer<typeof addTaskSchema>;

export const scheduleReminderSchema = z.object({
  message: z.string().min(1).describe("Reminder message"),
  time: z
    .string()
    .min(1)
    .describe("Time to trigger, HH:MM or relative minutes like '+5'"),
});
export type ScheduleReminderInput = z.infer<typeof scheduleReminderSchema>;

// ── Implementations ───────────────────────────────────────────────────────────

export async function getTasks(_args: GetTasksInput) {
  const filePath = path.join(os.tmpdir(), "daily-planner.json");
  try {
    if (!fs.existsSync(filePath)) {
      return { success: true, tasks: [] };
    }
    const data = fs.readFileSync(filePath, "utf8");
    return { success: true, tasks: JSON.parse(data) };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function addTask(args: AddTaskInput) {
  const { task, time } = addTaskSchema.parse(args);
  const filePath = path.join(os.tmpdir(), "daily-planner.json");

  try {
    let tasks: unknown[] = [];
    if (fs.existsSync(filePath)) {
      try {
        tasks = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch {
        tasks = [];
      }
    }

    const newTask = {
      id: Math.random().toString(36).substring(2, 9),
      task,
      time,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));

    return { success: true, task: newTask };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function scheduleReminder(args: ScheduleReminderInput) {
  const { message, time } = scheduleReminderSchema.parse(args);
  const filePath = path.join(os.tmpdir(), "daily-reminders.json");

  try {
    let reminders: unknown[] = [];
    if (fs.existsSync(filePath)) {
      try {
        reminders = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch {
        reminders = [];
      }
    }

    const newReminder = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      time,
      triggered: false,
      createdAt: new Date().toISOString(),
    };

    reminders.push(newReminder);
    fs.writeFileSync(filePath, JSON.stringify(reminders, null, 2));

    return { success: true, reminder: newReminder };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── ToolDefinitions ───────────────────────────────────────────────────────────

export const getTasksTool: ToolDefinition<GetTasksInput> = {
  name: "getTasks",
  description: "Get all tasks on the daily planner. Returns an array of task objects.",
  inputSchema: getTasksSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "getTasks",
};

export const addTaskTool: ToolDefinition<AddTaskInput> = {
  name: "addTask",
  description: "Add a new task to the daily planner with a title and time.",
  inputSchema: addTaskSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "addTask",
};

export const scheduleReminderTool: ToolDefinition<ScheduleReminderInput> = {
  name: "scheduleReminder",
  description:
    "Schedule a reminder. Use HH:MM format for a specific time, or '+N' for N minutes from now.",
  inputSchema: scheduleReminderSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "scheduleReminder",
};
