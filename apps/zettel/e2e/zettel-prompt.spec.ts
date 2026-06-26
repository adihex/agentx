import { test, expect } from "@playwright/test";

/**
 * E2E test against production (GitHub Pages → Cloud Run).
 * Signs up a fresh user, submits a prompt, and verifies the agent responds.
 */
test.describe("Zettel Prompt E2E (production)", () => {
  const timestamp = Date.now();
  const email = `e2e-prompt-${timestamp}@example.com`;
  const password = "Test1234!";

  test("should register, submit a prompt, and receive an agent response", async ({ page }) => {
    test.setTimeout(60000); // 60s timeout for production LLM generation
    // Capture console errors and network failures for debugging
    const consoleErrors: string[] = [];
    const networkFailures: { url: string; status: number; method: string; body?: string }[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
        console.log("CONSOLE ERROR:", msg.text());
      }
    });
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("api/auth") || url.includes("/adp")) {
        console.log(`${res.status()}: ${res.request().method()} ${url.split("run.app")[1] ?? url}`);
        if (res.status() >= 400) {
          const body = await res.text().catch(() => "");
          networkFailures.push({ url, status: res.status(), method: res.request().method(), body });
        }
      }
    });

    // Monitor WebSocket connections
    let wsConnected = false;
    let wsMessages: string[] = [];
    page.on("websocket", (ws) => {
      console.log(`WebSocket opened: ${ws.url()}`);
      wsConnected = true;
      ws.on("framereceived", (frame) => {
        const data = typeof frame.payload === "string" ? frame.payload : "<binary>";
        wsMessages.push(data);
        console.log(`WS ← ${data.slice(0, 200)}`);
      });
      ws.on("framesent", (frame) => {
        const data = typeof frame.payload === "string" ? frame.payload : "<binary>";
        console.log(`WS → ${data.slice(0, 200)}`);
      });
      ws.on("close", () => console.log("WebSocket closed"));
    });

    // ── Step 1: Navigate to production ──
    console.log("Step 1: Navigating to production URL...");
    await page.goto("https://adihex.github.io/zettel/?v=" + Date.now(), {
      waitUntil: "networkidle",
    });

    // Should see auth page
    await expect(page.getByText("Sign in to your study")).toBeVisible({ timeout: 15000 });
    console.log("✅ Auth page loaded");

    // ── Step 2: Register ──
    console.log("Step 2: Registering...");
    // Click the button to switch to registration mode ("Create a workspace")
    await page.getByRole("button", { name: "Create a workspace" }).click();
    await expect(page.locator("#auth-name")).toBeVisible();

    await page.locator("#auth-name").fill("E2E Prompt Test");
    await page.locator("#auth-email").fill(email);
    await page.locator("#auth-password").fill(password);
    await page.getByRole("button", { name: "Create workspace", exact: true }).click();

    // Wait for main page
    await expect(page.locator("text=A quiet place to think.")).toBeVisible({ timeout: 15000 });
    console.log("✅ Signup succeeded — main page loaded");

    // ── Step 3: Wait for WebSocket (ADP) connection ──
    console.log("Step 3: Waiting for WebSocket connection...");
    
    // We should wait until the input placeholder changes from "Connecting to agent..." to "Capture a thought..."
    const promptInput = page.locator("textarea, input[placeholder*='thought']");
    await expect(promptInput).toBeVisible({ timeout: 15000 });
    
    // Let's print out what the current placeholder is
    const placeholder = await promptInput.getAttribute("placeholder");
    console.log(`Current placeholder: ${placeholder}`);
    
    // Wait for the placeholder to become "Capture a thought…" (meaning connected is true)
    await expect(promptInput).toHaveAttribute("placeholder", "Capture a thought…", { timeout: 30000 });
    console.log("✅ WebSocket connected, placeholder updated to 'Capture a thought…'");

    // ── Step 4: Submit a prompt ──
    console.log("Step 4: Submitting prompt...");
    await promptInput.fill("Tell me about apples.");
    await promptInput.press("Enter");
    console.log("✅ Prompt submitted");

    // ── Step 5: Wait for agent response ──
    console.log("Step 5: Waiting for agent response...");

    // The agent response should appear as a .turn-assistant element
    // Wait up to 30s for a response (production LLM can be slow)
    try {
      const assistantTurn = page.locator(".turn-assistant", { hasText: /[a-zA-Z]/ });
      await expect(assistantTurn.first()).toBeVisible({ timeout: 55000 });
      const responseText = await assistantTurn.first().textContent();
      console.log(`✅ Agent responded: "${responseText?.slice(0, 200)}"`);
    } catch (err) {
      // Capture page state for debugging
      console.log("\n=== DEBUG: No agent response received ===");
      console.log(`WebSocket connected: ${wsConnected}`);
      console.log(`WS messages received: ${wsMessages.length}`);
      if (wsMessages.length > 0) {
        console.log("Last 5 WS messages:");
        wsMessages.slice(-5).forEach((m) => console.log(`  ${m.slice(0, 300)}`));
      }
      console.log(`Console errors: ${consoleErrors.length}`);
      consoleErrors.forEach((e) => console.log(`  ${e}`));
      console.log(`Network failures: ${networkFailures.length}`);
      networkFailures.forEach((f) => console.log(`  ${f.status} ${f.method} ${f.url}: ${f.body}`));

      // Take a screenshot
      await page.screenshot({ path: "e2e/screenshots/prompt-failure.png", fullPage: true });
      console.log("Screenshot saved to e2e/screenshots/prompt-failure.png");

      // Get current DOM state
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      console.log("Page HTML (truncated):", bodyHTML.slice(0, 2000));

      throw new Error("Agent did not respond within 30s — see debug output above");
    }

    // ── Step 6: Cleanup — sign out ──
    console.log("Step 6: Signing out...");
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByText("Sign in to your study")).toBeVisible();
    console.log("✅ Signed out successfully");
  });
});
