import { test, expect } from "@playwright/test";

test.describe("Zettel Production E2E (cross-origin)", () => {
  const timestamp = Date.now();
  const email = `prod-${timestamp}@example.com`;
  const password = "Test1234!";

  test("should register cross-origin from GitHub Pages to Cloud Run", async ({ page }) => {
    // Capture ALL network failures
    const failures: { url: string; status: number; method: string }[] = [];
    page.on("response", (res) => {
      if (res.url().includes("api/auth")) {
        const postData = res.request().postData();
        console.log(`${res.status()}: ${res.request().method()} ${res.url().split("run.app")[1]}`);
        if (postData) console.log(`  Body: ${postData}`);
        if (res.status() >= 400) {
          failures.push({ url: res.url(), status: res.status(), method: res.request().method() });
          res
            .text()
            .then((body) => console.log(`  Response: ${body}`))
            .catch(() => {});
        }
      }
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
    });
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

    // Go to the GitHub Pages production URL with cache bust
    await page.goto("https://adihex.github.io/zettel/?v=" + Date.now(), {
      waitUntil: "networkidle",
    });

    // Should see the auth form
    await expect(page.getByText("Sign in to your study")).toBeVisible({ timeout: 10000 });

    // Switch to Register
    await page.getByRole("button", { name: "Create a workspace" }).click();
    await expect(page.locator("#auth-name")).toBeVisible();

    // Fill signup form
    await page.locator("#auth-name").fill("Prod Test");
    await page.locator("#auth-email").fill(email);
    await page.locator("#auth-password").fill(password);

    // Click Create workspace
    await page.getByRole("button", { name: "Create workspace", exact: true }).click();

    // Wait for either success or error
    try {
      await expect(page.locator("text=A quiet place to think.")).toBeVisible({ timeout: 15000 });
      console.log("✅ Signup succeeded — main page loaded");
    } catch {
      // Check for error message
      const errorEl = page.locator(".auth-error");
      if (await errorEl.isVisible()) {
        const errText = await errorEl.textContent();
        console.log(`❌ Auth error displayed: "${errText}"`);
      }
      console.log("❌ Network failures:", JSON.stringify(failures));
      throw new Error("Signup failed — see failures above");
    }

    // If we got here, signup worked
    console.log("✅ Cross-origin signup successful!");

    // Sign out to clean up
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByText("Sign in to your study")).toBeVisible();
  });
});
