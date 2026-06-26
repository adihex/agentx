import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("Zettel Audio Transcription E2E", () => {
  const timestamp = Date.now();
  const email = `audio-test-${timestamp}@example.com`;
  const password = "password123";
  const dummyWavPath = path.join(__dirname, `dummy-${timestamp}.wav`);

  test.beforeAll(() => {
    // Create a dummy WAV file for input uploading
    fs.writeFileSync(dummyWavPath, "RIFF....WAVEfmt ....data....");
  });

  test.afterAll(() => {
    if (fs.existsSync(dummyWavPath)) {
      fs.unlinkSync(dummyWavPath);
    }
  });

  test("should transcribe uploaded audio and trigger agent processing", async ({ page }) => {
    page.on("console", (msg) => console.log("BROWSER LOG:", msg.type(), msg.text()));
    page.on("pageerror", (err) => console.log("BROWSER ERROR:", err.stack || err.message));

    // Sign up
    await page.goto("/");
    await page.getByRole("button", { name: "Create a workspace" }).click();
    await expect(page.locator("#auth-name")).toBeVisible();
    await page.locator("#auth-name").fill("Audio User");
    await page.locator("#auth-email").fill(email);
    await page.locator("#auth-password").fill(password);
    await page.getByRole("button", { name: "Create workspace", exact: true }).click();

    // Verify main page loaded
    await expect(page.locator("text=A quiet place to think.")).toBeVisible();

    // Wait for agent/WebSocket connection indicator
    const promptInput = page.getByPlaceholder("Capture a thought…");
    await expect(promptInput).toBeEnabled();

    // Upload dummy audio file via file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(dummyWavPath);

    // Wait for the agent message response in the thread panel
    // The mocked backend transcription should return "Write a note about apples." or similar,
    // which the agent stub will process to return "successfully created the note".
    const turnAssistant = page.locator(".turn-assistant");
    await expect(turnAssistant.last()).toContainText("successfully created the note", { timeout: 20000 });

    // Verify that the note is added to the sidebar note rail by the agent
    const noteItem = page.locator(".index-item");
    await expect(noteItem).toHaveCount(1);
    await expect(noteItem.locator(".index-item-title")).toContainText("About Apples");

    // Sign out
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.locator("text=Sign in to your study")).toBeVisible();
  });
});
