import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { getTasks, addTask, scheduleReminder } from "./planner.js";

describe("Planner Tools", () => {
  const plannerPath = path.join(os.tmpdir(), "daily-planner.json");
  const remindersPath = path.join(os.tmpdir(), "daily-reminders.json");

  beforeAll(() => {
    if (fs.existsSync(plannerPath)) fs.unlinkSync(plannerPath);
    if (fs.existsSync(remindersPath)) fs.unlinkSync(remindersPath);
  });

  it("should add a task and read it back", async () => {
    const addRes = await addTask({ task: "Submit report", time: "14:00" });
    expect(addRes.success).toBe(true);
    expect((addRes as any).task.task).toBe("Submit report");
    expect((addRes as any).task.time).toBe("14:00");

    const getRes = await getTasks({});
    expect(getRes.success).toBe(true);
    expect((getRes as any).tasks.length).toBe(1);
    expect((getRes as any).tasks[0].task).toBe("Submit report");
  });

  it("should schedule a reminder", async () => {
    const remRes = await scheduleReminder({ message: "Stand up", time: "+5" });
    expect(remRes.success).toBe(true);
    expect((remRes as any).reminder.message).toBe("Stand up");
    expect((remRes as any).reminder.time).toBe("+5");
  });
});
